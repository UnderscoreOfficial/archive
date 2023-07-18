import sqlite3

connect = sqlite3.connect("db.sqlite3")
cursor = connect.cursor()
cursor.execute("UPDATE archive_beta_2_app_storagespace SET drive_path = ? WHERE id = ?", ("/plex_8tb", 5))
connect.commit()
connect.close()
