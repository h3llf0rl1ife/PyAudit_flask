# Change this in deployment
activate_this = 'D:/PyEnvs/EnvAudit/Scripts/activate_this.py'

with open(activate_this) as file_:
    exec(file_.read(), dict(__file__=activate_this))

from PyAudit_flask import app as application