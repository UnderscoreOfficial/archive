import os
import sqlite3

connect = sqlite3.connect("db.sqlite3")
cursor = connect.cursor()

cursor.execute("SELECT id, name FROM archive_beta_2_app_lengths")

connect.commit()
connect.close()

