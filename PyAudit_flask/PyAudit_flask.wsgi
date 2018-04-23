import sys
sys.path.insert(0,"D:\PyProjects")

from PyAudit_flask import app as application

from werkzeug.debug import DebuggedApplication
application = DebuggedApplication(application, True)
