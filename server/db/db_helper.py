import sys
import sqlite3

# Register NetAlertX directories
INSTALL_PATH="/app"
sys.path.extend([f"{INSTALL_PATH}/server"])

from helper import if_byte_then_to_str
from logger import mylog  

#-------------------------------------------------------------------------------
#  Return the SQL WHERE clause for filtering devices based on their status.

def get_device_condition_by_status(device_status):
    """
    Return the SQL WHERE clause for filtering devices based on their status.

    Parameters:
        device_status (str): The status of the device. Possible values:
            - 'all'        : All active devices
            - 'my'         : Same as 'all' (active devices)
            - 'connected'  : Devices that are active and present in the last scan
            - 'favorites'  : Devices marked as favorite
            - 'new'        : Devices marked as new
            - 'down'       : Devices not present in the last scan but with alerts
            - 'archived'   : Devices that are archived

    Returns:
        str: SQL WHERE clause corresponding to the device status.
             Defaults to 'WHERE 1=0' for unrecognized statuses.
    """
    conditions = {
        'all':        'WHERE devIsArchived=0',
        'my':         'WHERE devIsArchived=0',
        'connected':  'WHERE devIsArchived=0 AND devPresentLastScan=1',
        'favorites':  'WHERE devIsArchived=0 AND devFavorite=1',
        'new':        'WHERE devIsArchived=0 AND devIsNew=1',
        'down':       'WHERE devIsArchived=0 AND devAlertDown != 0 AND devPresentLastScan=0',
        'archived':   'WHERE devIsArchived=1'
    }
    return conditions.get(device_status, 'WHERE 1=0')



#-------------------------------------------------------------------------------
#  Creates a JSON-like dictionary from a database row
def row_to_json(names, row):
    """
    Convert a database row into a JSON-like dictionary.

    Parameters:
        names (list of str): List of column names corresponding to the row fields.
        row (dict or sequence): A database row, typically a dictionary or list-like object,
                                where each column can be accessed by index or key.

    Returns:
        dict: A dictionary where keys are column names and values are the corresponding
              row values. Byte values are automatically converted to strings using
              `if_byte_then_to_str`.
    
    Example:
        names = ['id', 'name', 'data']
        row = {0: 1, 1: b'Example', 2: b'\x01\x02'}
        row_to_json(names, row)
        # Returns: {'id': 1, 'name': 'Example', 'data': '\\x01\\x02'}
    """
    rowEntry = {}

    for index, name in enumerate(names):
        rowEntry[name] = if_byte_then_to_str(row[name])

    return rowEntry

#-------------------------------------------------------------------------------
def sanitize_SQL_input(val):
    """
    Sanitize a value for use in SQL queries by replacing single quotes in strings.

    Parameters:
        val (any): The value to sanitize.

    Returns:
        str or any: 
            - Returns an empty string if val is None.
            - Returns a string with single quotes replaced by underscores if val is a string.
            - Returns val unchanged if it is any other type.
    """
    if val is None:
        return ''
    if isinstance(val, str):
        return val.replace("'", "_")
    return val  # Return non-string values as they are


# -------------------------------------------------------------------------------------------   
def get_date_from_period(period):
    """
    Convert a period string into an SQLite date expression.

    Parameters:
        period (str): The requested period (e.g., '7 days', '1 month', '1 year', '100 years').

    Returns:
        str: An SQLite date expression like "date('now', '-7 day')" corresponding to the period.
    """
    days_map = {
        '7 days': 7,
        '1 month': 30,
        '1 year': 365,
        '100 years': 3650,  # actually 10 years in original PHP
    }

    days = days_map.get(period, 1)  # default 1 day
    period_sql = f"date('now', '-{days} day')"

    return period_sql



#-------------------------------------------------------------------------------
def print_table_schema(db, table):
    """
    Print the schema of a database table to the log.

    Parameters:
        db: A database connection object with a `sql` cursor.
        table (str): The name of the table whose schema is to be printed.

    Returns:
        None: Logs the column information including cid, name, type, notnull, default value, and primary key.
    """
    sql = db.sql
    sql.execute(f"PRAGMA table_info({table})")
    result = sql.fetchall()

    if not result:
        mylog('none', f'[Schema] Table "{table}" not found or has no columns.')
        return

    mylog('debug', f'[Schema] Structure for table: {table}')
    header = f"{'cid':<4} {'name':<20} {'type':<10} {'notnull':<8} {'default':<10} {'pk':<2}"
    mylog('debug', header)
    mylog('debug', '-' * len(header))

    for row in result:
        # row = (cid, name, type, notnull, dflt_value, pk)
        line = f"{row[0]:<4} {row[1]:<20} {row[2]:<10} {row[3]:<8} {str(row[4]):<10} {row[5]:<2}"
        mylog('debug', line)

#-------------------------------------------------------------------------------
# Generate a WHERE condition for SQLite based on a list of values.
def list_to_where(logical_operator, column_name, condition_operator, values_list):
    """
    Generate a WHERE condition for SQLite based on a list of values.

    Parameters:
    - logical_operator: The logical operator ('AND' or 'OR') to combine conditions.
    - column_name: The name of the column to filter on.
    - condition_operator: The condition operator ('LIKE', 'NOT LIKE', '=', '!=', etc.).
    - values_list: A list of values to be included in the condition.

    Returns:
    - A string representing the WHERE condition.
    """

    # If the list is empty, return an empty string
    if not values_list:
        return ""

    # Replace {s-quote} with single quote in values_list
    values_list = [value.replace("{s-quote}", "'") for value in values_list]

    # Build the WHERE condition for the first value
    condition = f"{column_name} {condition_operator} '{values_list[0]}'"

    # Add the rest of the values using the logical operator
    for value in values_list[1:]:
        condition += f" {logical_operator} {column_name} {condition_operator} '{value}'"

    return f'({condition})'

#-------------------------------------------------------------------------------
def get_table_json(sql, sql_query):
    """
    Execute a SQL query and return the results as JSON-like dict.

    Args:
        sql: SQLite cursor or connection wrapper supporting execute(), description, and fetchall().
        sql_query (str): The SQL query to execute.

    Returns:
        dict: JSON-style object with data and column names.
    """
    try:
        sql.execute(sql_query)
        column_names = [col[0] for col in sql.description]
        rows = sql.fetchall()
    except sqlite3.Error as e:
        mylog('verbose', ['[Database] - SQL ERROR: ', e])
        return json_obj({}, [])  # return empty object

    if (rows):
        result = {"data": [row_to_json(column_names, row) for row in rows]}
        return json_obj(result, column_names)
    else:
        # the SQL query returned no rows
        return json_obj({}, [])  # return empty object


#-------------------------------------------------------------------------------
class json_obj:
    """
    A wrapper class for JSON-style objects returned from database queries.
    Provides dict-like access to the JSON data while storing column metadata.

    Attributes:
        json (dict): The actual JSON-style data returned from the database.
        columnNames (list): List of column names corresponding to the data.
    """

    def __init__(self, jsn, columnNames):
        """
        Initialize the json_obj with JSON data and column names.

        Args:
            jsn (dict): JSON-style dictionary containing the data.
            columnNames (list): List of column names for the data.
        """
        self.json = jsn
        self.columnNames = columnNames

    def get(self, key, default=None):
        """
        Dict-like .get() access to the JSON data.

        Args:
            key (str): Key to retrieve from the JSON data.
            default: Value to return if key is not found (default: None).

        Returns:
            Value corresponding to key in the JSON data, or default if not present.
        """
        return self.json.get(key, default)

    def keys(self):
        """
        Return the keys of the JSON data.

        Returns:
            Iterable of keys in the JSON dictionary.
        """
        return self.json.keys()

    def items(self):
        """
        Return the items of the JSON data.

        Returns:
            Iterable of (key, value) pairs in the JSON dictionary.
        """
        return self.json.items()

    def __getitem__(self, key):
        """
        Allow bracket-access (obj[key]) to the JSON data.

        Args:
            key (str): Key to retrieve from the JSON data.

        Returns:
            Value corresponding to the key.
        """
        return self.json[key]
