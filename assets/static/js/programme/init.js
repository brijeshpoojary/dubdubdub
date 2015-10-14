(function() {
    var tplAssessmentClass,
        tplSchool,
        tplBoundary,
        tplAssessmentSchool;
    klp.init = function() {
        console.log("init programme page", PROGRAMME_ID);
        klp.router = new KLPRouter();
        klp.router.init();
        initializeSelect2();
        tplAssessmentClass = swig.compile($('#tpl-assessment-class').html());
        tplSchool = swig.compile($('#tpl-school').html());
        tplBoundary = swig.compile($('#tpl-boundary').html());
        tplAssessmentSchool = swig.compile($('#tpl-assessment-school').html());
        //fetchProgrammeDetails();
        klp.router.events.on('hashchange', function(event, params) {
            fetchProgrammeDetails();
        });
        klp.router.start();
    };

    function initializeSelect2() {
        $('#select2search').select2({
            placeholder: 'Search for schools and boundaries',
            minimumInputLength: 3,
            ajax: {
                url: "/api/v1/search",
                quietMillis: 300,
                allowClear: true,
                data: function (term, page) {
                    return {
                        text: term,
                        geometry: 'yes'
                    };
                },
                results: function (data, page) {
                    var searchResponse = {
                        results: [
                        {
                            text: "Pre-Schools",
                            children: makeResults(data.pre_schools.features, 'school')
                        },
                        {
                            text: "Primary Schools",
                            children: makeResults(data.primary_schools.features, 'school')
                        },
                        {
                            text: "Boundaries",
                            children: makeResults(data.boundaries.features, 'boundary')
                        }
                        ]
                    };
                    return {results: searchResponse.results};
                }
            }
        });

        $('#select2search').on("change", function(choice) {
            console.log(choice);
            var objectId = choice.added.data.properties.id;
            var entityType = choice.added.data.entity_type;
            var boundaryType = choice.added.data.properties.type;
            if (entityType === 'school') {
                var paramKey = entityType;
            } else if (boundaryType == 'district') {
                var paramKey = 'admin_1';
            } else if (['project', 'block'].indexOf(boundaryType) !== -1) {
                var paramKey = 'admin_2';
            } else if (['circle', 'cluster'].indexOf(boundaryType) !== -1) {
                var paramKey = 'admin_3';
            } else {
                var paramKey = 'error';
            }
            var hashParams = {
                'school': null,
                'admin1': null,
                'admin2': null,
                'admin3': null
            };
            hashParams[paramKey] = objectId;
            klp.router.setHash(null, hashParams);
        });
    }

    function makeResults(array, type) {
        var schoolDistrictMap = {
            'primaryschool': 'Primary School',
            'preschool': 'Preschool'
        };
        return _(array).map(function(obj) {
            var name = obj.properties.name;
            if (type === 'boundary') {
                if (obj.properties.type === 'district') {
                    name = obj.properties.name + ' - ' + schoolDistrictMap[obj.properties.school_type] + ' ' + obj.properties.type;
                } else {
                    name = obj.properties.name + ' - ' + obj.properties.type;
                }
            }

            obj.entity_type = type;
            return {
                id: obj.properties.id,
                text: _.str.titleize(name),
                data: obj
            };
        });
    }


    function fetchProgrammeDetails() {
        var params = klp.router.getHash().queryParams;
        var url = "programme/" + PROGRAMME_ID;
        var $xhr = klp.api.do(url, params);
        $('#assessmentsContainer').empty().text("Loading...");
        $('#entityDetails').empty();
        fetchEntityDetails(params);
        $xhr.done(function(data) {
            var assessmentsContext = getContext(data);
            //console.log("ass context", assessmentsContext);
            renderAssessments(assessmentsContext);
            var programme_html = "<ul id='improved' class='js-accordion-container'>" 
                    + $('#assessmentsContainer').html() + "</ul>";
            $('#assessmentsContainer').html(programme_html);
            renderSchoolScore();
            klp.accordion.init();
            doPostRender();
        });
    }

    function fetchEntityDetails(params) {
        var entityType = _.keys(params)[0];
        if (entityType === 'school') {
            fetchSchoolDetails(params.school)
        } else {
            fetchBoundaryDetails(params[entityType]);
        }
    }

    function fetchSchoolDetails(id) {
        //console.log("school", id);
        var url = "schools/school/" + id;
        var $schoolXHR = klp.api.do(url, {});
        $schoolXHR.done(function(data) {
            var context = getSchoolContext(data);
            var html = tplSchool(data);
            $('#entityDetails').html(html);
        });
    }

    function getSchoolContext(data) {
        //console.log("school", data);
        if (data.type.id === 1) {
            data.type_name = 'school';
        } else {
            data.type_name = 'preschool';
        }
        return data;
    }

    function fetchBoundaryDetails(id) {
        var url = "boundary/admin/" + id;
        var $boundaryXHR = klp.api.do(url, {});
        $boundaryXHR.done(function(data) {
            var html = tplBoundary(data);
            $('#entityDetails').html(html);
        });
    }

    function doPostRender() {
        var typeMap = {
            'admin1': 'admin_1',
            'admin2': 'admin_2',
            'admin3': 'admin_3'
        };

        $('.js-boundaryLink').click(function(e) {
            console.log("clicked");
            e.preventDefault();
            var boundaryType = $(this).attr("data-type");
            var boundaryId = $(this).attr("data-id");
            var paramKey = typeMap[boundaryType];
            var hashParams = {
                'school': null,
                'admin_1': null,
                'admin_2': null,
                'admin_3': null
            };
            hashParams[paramKey] = boundaryId;
            klp.router.setHash(null, hashParams);
        });
    }

    function renderAssessments(assessmentClasses) {
        $('#assessmentsContainer').empty();
        var classes = _.keys(assessmentClasses);
        classes.forEach(function(className, i) {
            var html = tplAssessmentClass({
                'className': className,
                'assessments': assessmentClasses[className]
            });
            $('#assessmentsContainer').append( html );
        });
        if (classes.length == 0) {
            $('#assessmentsContainer').text("No programme information available.")
        }
        $('#select2search').select2('data', null);
    }

    function renderSchoolScore(assessmentsSchool) {
        assessmentsSchool = {
                            "count":4,
                            "next":null,
                            "previous":null,
                            "features":
                            [
                                {
                                    "assessmentname":"Post test",
                                    "academicyear_name":"2010-2011",
                                    "singlescore":"82.00",
                                    "percentile":null,
                                    "boundary":
                                    {
                                        "admin1":
                                        {
                                            "boundary__name":"bangalore",

                                            "percentile":null,
                                            "singlescore":"80.00",
                                            "boundary":8877
                                        },
                                            "admin3":{
                                            "boundary__name":"chickpet",
                                            "percentile":null,
                                            "singlescore":"78.00",
                                            "boundary":8984
                                        },
                                            "admin2":{
                                            "boundary__name":"south-2",
                                            "percentile":null,
                                            "singlescore":"84.00",
                                            "boundary":8880
                                        }
                                    }
                                },
                                {
                                    "assessmentname":"Pre test",
                                    "academicyear_name":"2010-2011",
                                    "singlescore":"55.00",
                                    "percentile":null,
                                    "boundary":
                                    {
                                        "admin1":{
                                        "boundary__name":"bangalore",
                                        "percentile":null,
                                        "singlescore":"74.00",
                                        "boundary":8877
                                        },
                                        "admin3":{
                                        "boundary__name":"chickpet",
                                        "percentile":null,
                                        "singlescore":"70.00",
                                        "boundary":8984
                                        },
                                        "admin2":{
                                        "boundary__name":"south-2",

                                        "percentile":null,
                                        "singlescore":"75.00",
                                        "boundary":8880
                                        }
                                    }
                                }
                            ]
                        };

        $('#schoolContainer').empty();
        var html = tplAssessmentSchool({'assessments':assessmentsSchool["features"]})
        $('#schoolContainer').append(html);
        if (assessmentsSchool.length == 0) {
            $('#schoolContainer').text("No programme information available.")
        }
    }

    function getContext(data) {
        var assessmentsArray = data.features;
        var groupedByClass = _.groupBy(assessmentsArray, function(assessment) {
            return assessment.studentgroup;
        });
        _.each(_(groupedByClass).keys(), function(className) {
            groupedByClass[className] = getClassContext(groupedByClass[className]);
        });
        console.log("context", groupedByClass);
        return groupedByClass;
        //console.log("group by", groupedByClass);
    }

    function getClassContext(classData) {
        var ret = [];
        _.each(classData, function(assessmentData) {
            ret.push(getAssessmentContext(assessmentData));
        });
        return ret;
    }

    function getAssessmentContext(assessmentData) {
        console.log("assessment data", assessmentData);
        var genders = [];
        assessmentData.score = getScore(assessmentData.singlescore, assessmentData.gradesinglescore);
        for (var j=0, length=assessmentData.singlescoredetails.gender.length; j < length; j++) {
            var scoreDetails = assessmentData.singlescoredetails.gender[j];
            var cohortsDetails = assessmentData.cohortsdetails.gender[j];
            var gender = {
                'name': scoreDetails.sex == 'male' ? 'Boys' : 'Girls',
                'icon': scoreDetails.sex == 'male' ? 'boy' : 'girl',
                'singlescore': scoreDetails.singlescore,
                'score': getScore(scoreDetails.singlescore, scoreDetails.gradesinglescore),
                'cohorts': cohortsDetails.total
            };
            genders.push(gender);
        }
        assessmentData.genders = genders;

        var mts = [];
        for (var i=0, length = assessmentData.cohortsdetails.mt.length; i < length; i++) {
            var singleScore = assessmentData.singlescoredetails.mt[i].singlescore;
            var gradeScore = assessmentData.singlescoredetails.mt[i].gradesinglescore;
            var mt = {
                'name': assessmentData.cohortsdetails.mt[i].mt,
                'singlescore': assessmentData.singlescoredetails.mt[i].singlescore,
                'score': getScore(singleScore, gradeScore)
            };
            mts.push(mt);
        }
        assessmentData.mts = mts;

        var compares = [];
        var boundary = assessmentData.singlescoredetails.boundary;
        var boundaryKeys = _.keys(boundary);
        _.each(boundaryKeys, function(key) {

            var compareObj = {
                'id': boundary[key].boundary,
                'type': key,
                'name': boundary[key].boundary__name,
                'singlescore': boundary[key].singlescore,
                'score': getScore(boundary[key].singlescore, boundary[key].gradesinglescore)
            };
            compares.push(compareObj);
        });
        assessmentData.compares = compares;
        console.log("assessment data processed", assessmentData);
        return assessmentData;
    }

    function getScore(singleScore, gradeScore) {
        if (singleScore) {
            var score = parseInt(singleScore);
            var val = "" + score + "%";
            var typ = "number";
        } else {
            var val = gradeScore;
            var typ = "grade";
        }
        return {
            'value': val,
            'type': typ
        }
    }

})();