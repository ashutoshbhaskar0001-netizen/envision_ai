import sys
import traceback
import inspect
from sqlalchemy.orm import Session
from app.agents.base import BaseAgent
from app.models.models import ErrorLogs
from app.services.gemini_service import GeminiService

class SelfHealingAgent(BaseAgent):
    def __init__(self):
        super().__init__("Self-Healing Agent")
        self.gemini = GeminiService()

    def run_with_healing(self, db: Session, func, *args, **kwargs):
        """Executes a function and automatically attempts to heal it if it raises an exception."""
        try:
            # Try running the function normally
            return func(*args, **kwargs)
        except Exception as e:
            # Capture exception details
            error_message = str(e)
            exc_type, exc_value, exc_tb = sys.exc_info()
            tb_list = traceback.format_exception(exc_type, exc_value, exc_tb)
            stack_trace = "".join(tb_list)
            
            # Extract source code of the failed function
            try:
                code_context = inspect.getsource(func)
            except Exception as source_err:
                code_context = f"# Could not extract source code: {source_err}\n# Function name: {func.__name__}"
                
            self.log_message(
                db, 
                "ERROR", 
                f"Exception caught in '{func.__name__}': {error_message}. Triggering self-healing workflow..."
            )
            
            # Log error details into ErrorLogs table
            error_log = ErrorLogs(
                error_message=error_message,
                stack_trace=stack_trace,
                code_context=code_context,
                resolved=False
            )
            db.add(error_log)
            db.commit()
            db.refresh(error_log)
            
            # Send to Gemini to get correction proposal
            try:
                analysis = self.gemini.analyze_error(error_message, stack_trace, code_context)
            except Exception as gemini_err:
                self.log_message(db, "ERROR", f"Gemini connection failed during healing: {gemini_err}")
                analysis = {
                    "explanation": "Gemini connection error during recovery request.",
                    "root_cause": "Network/API timeout",
                    "corrected_code": code_context  # fallback to original code
                }

            explanation = analysis.get("explanation", "No explanation provided.")
            root_cause = analysis.get("root_cause", "Unknown cause.")
            corrected_code = analysis.get("corrected_code", "")

            # Automatically create patch.py
            patch_content = f"""# =========================================================
# SELF-HEALING AUTOMATIC PATCH
# Generated on: {error_log.timestamp}
# Error: {error_message}
# Root Cause: {root_cause}
# Explanation: {explanation}
# =========================================================

{corrected_code}
"""
            try:
                with open("patch.py", "w", encoding="utf-8") as patch_file:
                    patch_file.write(patch_content)
                self.log_message(db, "INFO", "Saved patch suggestion to 'patch.py'.")
            except Exception as file_err:
                self.log_message(db, "ERROR", f"Failed to write patch.py file: {file_err}")

            # Safe check & Dynamic Retry
            retry_success = False
            result = None
            if corrected_code and "def " in corrected_code:
                try:
                    self.log_message(db, "INFO", f"Attempting dynamic compilation and hot-fix execution of '{func.__name__}'...")
                    
                    # Compile and execute corrected code in a custom namespace
                    local_namespace = {}
                    # Add db session to namespace in case the function uses it
                    local_namespace["db"] = db
                    
                    # Execute the code to define the new function in local namespace
                    exec(corrected_code, globals(), local_namespace)
                    
                    # Retrieve the fixed function from the local namespace
                    fixed_func = local_namespace.get(func.__name__)
                    
                    if fixed_func:
                        # Attempt to run the corrected function with the original arguments
                        result = fixed_func(*args, **kwargs)
                        retry_success = True
                        self.log_message(db, "INFO", f"Dynamic retry succeeded! '{func.__name__}' ran successfully after patch.")
                    else:
                        self.log_message(db, "ERROR", f"Failed to locate patched function '{func.__name__}' in compiled namespace.")
                except Exception as retry_err:
                    self.log_message(db, "ERROR", f"Dynamic retry failed: {retry_err}")
            
            # Log final status
            if retry_success:
                error_log.resolved = True
                error_log.resolution_details = f"Recovered Automatically. Root cause: {root_cause}. Explanation: {explanation}"
                db.commit()
                self.log_message(db, "INFO", "Log Status updated: Recovered Automatically.")
                return result
            else:
                error_log.resolution_details = f"Manual Intervention Required. Attempted recovery but dynamic execution failed. Root cause: {root_cause}."
                db.commit()
                self.log_message(db, "ERROR", "Log Status updated: Manual Intervention Required.")
                # Re-raise the exception or return a clear error indicator so the API knows it failed
                raise e
