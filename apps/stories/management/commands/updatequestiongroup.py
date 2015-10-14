import datetime

from django.db import transaction
from django.core.management.base import BaseCommand

from stories.models import Questiongroup, Story

class Command(BaseCommand):
    args = ""
    help = """Fixes erroneous dates and
    Populates the start_date and end_date
    for all the Questiongroups.

    ./manage.py updatequestiongroup
    """

    @transaction.atomic
    def handle(self, *args, **options):
        try:
            web_2040_story = Story.objects.get(
                group__source__name='web',
                date_of_visit__year=2040
            )
            # The one entry with date_of_visit as 2040 has the created_at
            # time as 2010-09-10. So, we are using that.
            new_date = datetime.datetime.strptime('2010-09-10', '%Y-%m-%d')
            web_2040_story.date_of_visit = new_date
            web_2040_story.save()
        except:
            pass

        # Certain date_of_visit values have the year as 1900. Since all community
        # V2 data was collected after June 1st 2014, we are setting any earlier
        # dates than 28th March 2014 to June 1st.

        earliest_allowed_date = datetime.datetime.strptime('2014-03-28', '%Y-%m-%d')
        v2_ancient_stories = Story.objects.filter(
            group__version=2,
            group__source__name='community',
            date_of_visit__lt=earliest_allowed_date
        )
        new_date = datetime.datetime.strptime('2014-06-01', '%Y-%m-%d')
        v2_ancient_stories.update(date_of_visit=new_date)

        q_groups = Questiongroup.objects.all()
        for q in q_groups:
            q.start_date = Story.objects.filter(
                group=q
            ).values(
                'date_of_visit'
            ).earliest(
                'date_of_visit'
            )['date_of_visit']

            q.end_date = Story.objects.filter(
                group=q
            ).values(
                'date_of_visit'
            ).latest(
                'date_of_visit'
            )['date_of_visit']

            q.save()
