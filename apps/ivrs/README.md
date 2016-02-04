The KLP IVRS app
----------------

# Existing infrastructure.

1. Mahiti IVRS. (Deprecated)
 - Question group version = 1
 - ivrs_type = None
 - Available at http://klpdata.mahiti.org/json_feeds.php?fromdate=08/29/2015&enddate=10/09/2015
 - Questions at:
   - https://github.com/klpdotorg/dubdubdub/blob/develop/apps/ivrs/management/commands/populateivrsdata.py
 - There is cron job in place that runs the following script everyday at 8:00PM.
   - https://github.com/klpdotorg/dubdubdub/blob/develop/apps/stories/management/commands/fetchivrs.py

2. GKA IVRS - old. (Deprecated)
 - Question group version = 2
 - ivrs_type = gka
 - Available at http://my.exotel.in/viamentis/flows/edit/46852#flowline/start
 - Questions at:
   - https://github.com/klpdotorg/dubdubdub/blob/develop/apps/ivrs/management/commands/populategkaivrsdata.py
 - There is cron job in place that runs the following script everyday at 8:15PM.
   - https://github.com/klpdotorg/dubdubdub/blob/develop/apps/ivrs/management/commands/fetchgkaivrs.py

3. Primary School IVRS.
 - Question group version = 3
 - ivrs_type = ivrs-pri
 - Available at http://my.exotel.in/viamentis/flows/edit/49659#flowline/start
 - Questions at:
   - https://github.com/klpdotorg/dubdubdub/blob/develop/apps/ivrs/management/commands/populatenewivrsdata.py
 - https://github.com/klpdotorg/dubdubdub/blob/develop/apps/ivrs/management/commands/fetchgkaivrs.py

4. PreSchool IVRS. (To be implemented)
 - Question group version = None
 - ivrs_type = ivrs-pre
 - Available at http://my.exotel.in/viamentis/flows/edit/49733#flowline/start
 - Question at:
   - None
 - Cron job to be implemented.

5. GKA IVRS - new. (Deprecated)
 - Question group version = 4
 - ivrs_type = gka-new
 - Available at http://klpdata.mahiti.org/json_feeds.php?fromdate=08/29/2015&enddate=10/09/2015
   - Dev at Nil.
 - Question at:
   - https://github.com/klpdotorg/dubdubdub/blob/develop/apps/ivrs/management/commands/populatenewgkaivrsdata.py 
 - https://github.com/klpdotorg/dubdubdub/blob/develop/apps/ivrs/management/commands/fetchgkaivrs.py

6. GKA IVRS - v3.
 - Question group version = 5
 - ivrs_type = gka-v3
 - Available at (To be implemented)
   - Dev at http://my.exotel.in/viamentis/flows/edit/57618#flowline/start
 - Question at:
   - https://github.com/klpdotorg/dubdubdub/blob/develop/apps/ivrs/management/commands/populatev3gkaivrsquestions.py 
 - https://github.com/klpdotorg/dubdubdub/blob/develop/apps/ivrs/management/commands/fetchgkaivrs.py


# Models
