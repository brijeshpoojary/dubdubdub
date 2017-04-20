from rest_framework.response import Response
from schools.models import Boundary, AcademicYear
from schools.api_views.aggregations import BaseSchoolAggView
from . import BaseBoundaryReport
from common.views import KLPAPIView
from common.exceptions import APIError
from django.conf import settings
from django.db.models import Q


class DemographicsBoundaryReportDetails(KLPAPIView, BaseSchoolAggView,
                                        BaseBoundaryReport):
    '''
    This class returns the demographic report details
    '''
    reportInfo = {}

    def get_details_data(self, boundaryData, active_schools, academic_year):
        self.reportInfo["categories"] = {}
        for data in boundaryData["cat"]:
            self.reportInfo["categories"][data["cat"]] = {
                "school_count": data["num_schools"],
                "student_count": data["num_boys"] + data["num_girls"]}
        self.reportInfo["languages"] = {"moi": {}, "mt": {}}
        for data in boundaryData["moi"]:
            self.reportInfo["languages"]["moi"][data["moi"].upper()] =\
                {"school_count": data["num"]}
        for data in boundaryData["mt"]:
            self.reportInfo["languages"]["mt"][data["name"].upper()] =\
                {"student_count": data["num_students"]}
        self.reportInfo["enrolment"] =\
            self.get_enrolment(boundaryData["cat"])

    def get_report_details(self, boundaryid):
        year = self.request.GET.get('year', settings.DEFAULT_ACADEMIC_YEAR)
        try:
            academic_year = AcademicYear.objects.get(name=year)
        except AcademicYear.DoesNotExist:
            raise APIError('Academic year is not valid.\
                    It should be in the form of 2011-2012.', 404)
        self.reportInfo["report_info"]["year"] = year

        try:
            boundary = Boundary.objects.get(pk=boundaryid)
        except Exception:
            raise APIError('Boundary not found', 404)

        active_schools = boundary.schools()
        boundaryData = self.get_aggregations(active_schools, academic_year)
        boundaryData = self.check_values(boundaryData)
        self.get_details_data(boundaryData, active_schools, academic_year)

    def get(self, request):
        mandatoryparams = {'id': [], 'language': ['english', 'kannada']}
        self.check_mandatory_params(mandatoryparams)
        id = self.request.GET.get("id")
        reportlang = self.request.GET.get("language")

        self.reportInfo["report_info"] = {"report_lang": reportlang}
        self.get_report_details(id)
        return Response(self.reportInfo)


class DemographicsBoundaryComparisonDetails(KLPAPIView, BaseSchoolAggView,
                                            BaseBoundaryReport):

    '''
        Returns report comparison details
    '''
    reportInfo = {"comparison": {"year-wise": {}, "neighbours": {}}}

    parentInfo = {}

    totalschools = 0

    def get_yeardata(self, active_schools, year, year_id):
        yeardata = {"year": year, "avg_enrol_upper": 0, "avg_enrol_lower": 0,
                    "school_count": 0}
        boundaryData = self.get_aggregations(active_schools, year_id)
        enrolment = self.get_enrolment(boundaryData["cat"])
        yeardata["avg_enrol_upper"] = \
            enrolment["Upper Primary"]["student_count"]
        yeardata["avg_enrol_lower"] = \
            enrolment["Lower Primary"]["student_count"]
        boundaryData = self.check_values(boundaryData)
        teacher_count = self.get_teachercount(active_schools, year_id)
        student_count = boundaryData["num_boys"] + boundaryData["num_girls"]
        yeardata["student_count"] = student_count
        yeardata["teacher_count"] = teacher_count
        yeardata["school_count"] = boundaryData["num_schools"]

        if teacher_count == 0:
            yeardata["ptr"] = "NA"
        else:
            yeardata["ptr"] = round(student_count/float(teacher_count), 2)
        return yeardata

    def get_year_comparison(self, active_schools, academic_year, year):
        comparisonData = []
        start_year = year.split('-')[0]
        end_year = year.split('-')[1]
        prev_year = str(int(start_year)-1) + "-" + str(int(end_year)-1)
        prev_prev_year = str(int(start_year)-2) + "-" + str(int(end_year)-2)

        prev_year_id = AcademicYear.objects.get(name=prev_year)
        prev_prev_year_id = AcademicYear.objects.get(name=prev_prev_year)

        yearData = {}

        prevYearData = self.get_yeardata(active_schools, prev_year,
                                         prev_year_id)
        prevPrevYearData = self.get_yeardata(active_schools,
                                             prev_prev_year, prev_prev_year_id)

        comparisonData.append(yearData)
        comparisonData.append(prevYearData)
        comparisonData.append(prevPrevYearData)

        return comparisonData

    def fillComparisonData(self, boundary, academic_year):
        data = {"name": boundary.name,
                "id": boundary.id,
                "type": boundary.hierarchy.name,
                "avg_enrol_upper": 0,
                "avg_enrol_lower": 0,
                "ptr": 0,
                "school_count": 0,
                "school_perc": 0}
        active_schools = boundary.schools()
        if active_schools.exists():
            boundaryData = self.get_aggregations(active_schools,
                                                 academic_year)
            boundaryData = self.check_values(boundaryData)
            enrolment = self.get_enrolment(boundaryData["cat"])
            data["avg_enrol_upper"] =\
                enrolment["Upper Primary"]["student_count"]
            data["avg_enrol_lower"] =\
                enrolment["Lower Primary"]["student_count"]
            data["school_count"] = boundaryData["num_schools"]
            teacher_count = self.get_teachercount(active_schools,
                                                  academic_year)
            student_count = boundaryData["num_boys"] +\
                boundaryData["num_girls"]
            data["student_count"] = student_count
            data["teacher_count"] = teacher_count
            if boundary.get_admin_level() == 1:
                self.totalschools += data["school_count"]
            else:
                parentInfo = self.get_parent_info(boundary)
                data["school_perc"] = round(
                    boundaryData["num_schools"] * 100 /
                    float(parentInfo["schoolcount"]), 2)
            if teacher_count == 0:
                data["ptr"] = "NA"
            else:
                data["ptr"] = round(student_count / float(teacher_count), 2)
        return data

    def get_boundary_comparison(self, academic_year, boundary):
        comparisonData = []
        if boundary.get_admin_level() == 1:
            boundaries = self.getDistrictNeighbours(boundary)
        elif boundary.get_admin_level() == 2:
            boundaries = Boundary.objects.filter(id=boundary.parent.id)
        else:
            boundaries = Boundary.objects.filter(Q(id=boundary.parent.id) |
                                                 Q(id=boundary.parent.parent.id))
        for comparisonboundary in boundaries:
            comparisonData.append(self.fillComparisonData(comparisonboundary,
                                                          academic_year))
        comparisonData.append(self.fillComparisonData(boundary, academic_year))
        if self.totalschools != 0:
            for data in comparisonData:
                data["school_perc"] = round(
                    data["school_count"] * 100 / self.totalschools, 2)
        return comparisonData

    def get_comparison_data(self, boundary, active_schools, academic_year, year):
        self.parentInfo = self.get_parent_info(boundary)
        self.reportInfo["parent"] = self.parentInfo
        self.reportInfo["comparison"] = {}
        self.reportInfo["comparison"]["year-wise"] =\
            self.get_year_comparison(active_schools, academic_year, year)
        self.reportInfo["comparison"]["neighbours"] =\
            self.get_boundary_comparison(academic_year, boundary)

    def get_report_comparison(self, boundaryid):
        year = self.request.GET.get('year', settings.DEFAULT_ACADEMIC_YEAR)
        try:
            academic_year = AcademicYear.objects.get(name=year)
        except AcademicYear.DoesNotExist:
            raise APIError('Academic year is not valid.\
                    It should be in the form of 2011-2012.', 404)
        try:
            boundary = Boundary.objects.get(pk=boundaryid)
        except Exception:
            raise APIError('Boundary not found', 404)

        active_schools = boundary.schools()
        boundaryData = self.get_aggregations(active_schools, academic_year)
        boundaryData = self.check_values(boundaryData)
        self.get_comparison_data(boundary, active_schools, academic_year,
                                 year)

    def get(self, request):
        mandatoryparams = {'id': [], 'language': ["english", "kannada"]}
        self.check_mandatory_params(mandatoryparams)

        id = self.request.GET.get("id")
        reportlang = self.request.GET.get("language")

        self.reportInfo["report_info"] = {"report_lang": reportlang}
        self.get_report_comparison(id)
        return Response(self.reportInfo)
