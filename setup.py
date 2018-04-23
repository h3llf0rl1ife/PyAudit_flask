from distutils.core import setup


requires = (
    'flask==0.12.2',
    'flask-login==0.4.1',
    'flask-wtf==0.14.2',
    'flask-sqlalchemy==2.3.2',
    'psycopg2==2.7.4',
    'dateparser==0.7.0'
)

setup(
    name='Audit5S',
    version='0.1',
    packages=['PyAudit_flask',],
    install_requires=requires,
)


# Install using "pip install -e ."