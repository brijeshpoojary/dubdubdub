from django.shortcuts import render
from django.contrib.gis.geos import Polygon
from coords.models import InstCoord
from klp.models import TbSchool
import json
from django.http import HttpResponse

def schools(request):
    bbox_string = request.GET.get("bounds")
    bbox = Polygon.from_bbox([float(b) for b in bbox_string.split(",")])
    insts = InstCoord.objects.filter(coord__within=bbox)
    inst_ids = [i.instid for i in insts]
    schools = TbSchool.objects.filter(id__in=inst_ids)
    count = schools.count()
    d = {
        'type': 'FeatureCollection',
        'count': count,
        'features': [s.get_geojson() for s in schools]
    }
    return HttpResponse(json.dumps(d))

# Create your views here.
