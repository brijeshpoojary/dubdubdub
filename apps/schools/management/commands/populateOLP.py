import os
import csv
import json
import datetime

from optparse import make_option

from django.utils import timezone
from django.db import transaction
from django.utils.text import slugify
from django.core.management.base import BaseCommand

from common.utils import get_logfile_path
from schools.models.choices import STATUS_CHOICES

from schools.models import (
    Boundary,
    BoundaryType,
    BoundaryHierarchy,
    DiseInfo,
    School
)

class Command(BaseCommand):
    args = "<path to file>"
    help = """Parses and populates the OLP School
    and boundary data.
    
    ./manage.py populateOLP --file=path/to/file"""
    
    option_list = BaseCommand.option_list + (
        make_option('--file',
                    help='Path to the csv file'),
        make_option('--confirm',
                    help='A mandatory parameter to avoid running this on any other instances'),
    )

    @transaction.atomic
    def handle(self, *args, **options):
        file_name = options.get('file', None)
        if not file_name:
            print "Please specify a filename with the --file argument"
            return

        confirm = options.get('confirm', None)
        if not confirm:
            print "Please pass in --confirm='yes_i_want_to_replace_klp_data_with_olp'"
            return

        if confirm != "yes_i_want_to_replace_klp_data_with_olp":
            print "Please pass in --confirm='yes_i_want_to_replace_klp_data_with_olp'"

        district_hierarchy = BoundaryHierarchy.objects.get(id=9, name='district') # Primary School districts
        block_hierarchy = BoundaryHierarchy.objects.get(name='block')
        cluster_hierarchy = BoundaryHierarchy.objects.get(name='cluster')

        primary_school_type = BoundaryType.objects.get(name='Primary School')

        latest_school_id = 63929 # School.objects.latest('id').id

        f = open(file_name, 'r')
        csv_f = csv.reader(f)
        output_sql = open(get_logfile_path("school_sql", "sql"), "w")

        count = 0

        for row in csv_f:
            # Skip first row
            if count == 0:
                count += 1
                continue

            district_name = row[2].strip().lower()
            block_name = row[4].strip().lower()
            cluster_name = row[6].strip().lower()
            area_name = row[8].strip().lower()
            school_id = row[9].strip()
            school_name = row[10].strip()
            category = 'Upper Primary'
            gender = 'co-ed'
            moi = 'english'
            management = 'ed'
            pincode = row[29].strip()
            longitude, latitude = row[171].strip(), row[172].strip()

            try:
                district, created = Boundary.objects.get_or_create(
                    name=district_name,
                    dise_slug=slugify(unicode(district_name)),
                    hierarchy=district_hierarchy,
                    type=primary_school_type,
                    status=2, # active. Defined in schools.models.choices
                )
            except Exception as ex:
                print "District"
                print ex
                print district_name
                print slugify(unicode(district_name))
                break

            try:
                block, created = Boundary.objects.get_or_create(
                    parent=district,
                    name=block_name,
                    dise_slug=slugify(unicode(district_name+' '+block_name)),
                    hierarchy=block_hierarchy,
                    type=primary_school_type,
                    status=2, # active. Defined in schools.models.choices
                )
            except Exception as ex:
                print "Block"
                print ex
                print block_name
                print slugify(unicode(district_name+' '+block_name))
                break

            try:
                cluster, created = Boundary.objects.get_or_create(
                    parent=block,
                    name=cluster_name,
                    dise_slug=slugify(unicode(block_name+' '+cluster_name)),
                    hierarchy=cluster_hierarchy,
                    type=primary_school_type,
                    status=2, # active. Defined in schools.models.choices
                )
            except Exception as ex:
                print "Cluster"
                print ex
                print cluster_name
                print slugify(unicode(block_name+' '+cluster_name))
                break

            try:
                latest_school_id += 1
                school, created = School.objects.get_or_create(
                    id=latest_school_id,
                    admin3=cluster,
                    # dise_info=int(school_id),
                    name=school_name,
                    cat=category,
                    sex=gender,
                    moi=moi,
                    mgmt=management,
                    status=2,
                )
                point = "ST_MakePoint(%s,%s)" % (longitude, latitude)
                sql = "INSERT INTO inst_coord (instid, coord) VALUES (%d,ST_SetSRID(%s,4326));" % (school.id, point)
                output_sql.write(sql + "\n")

                if created:
                    print "School created? :" + str(created) + "! School is " + str(school)
            except Exception as ex:
                print "School"
                print school_name
                print count
                print ex
                break

            count += 1
            if school.id % 2 ==0:
                print "-",
            else:
                print "*",
        else:
            print "Successfully imported data"

        output_sql.close()
        print "Unsuccessful"