(function() {
    var tplAssessment;
    klp.init = function() {
        console.log("init programme page", PROGRAMME_ID);
        klp.router = new KLPRouter();
        klp.router.init();
        initializeSelect2();
        tplAssessmentClass = swig.compile($('#tpl-assessment-class').html());
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
        var schoolId = klp.router.getHash().queryParams.school;
        var url = "programme/" + PROGRAMME_ID;
        var $xhr = klp.api.do(url, params);
        $('#assessmentsContainer').empty().text("Loading...");
        $xhr.done(function(data) {
            var assessmentsContext = getContext(data);
            //console.log("ass context", assessmentsContext);
            renderAssessments(assessmentsContext);
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
            $('#assessmentsContainer').append(html);
        });
        if (classes.length == 0) {
            $('#assessmentsContainer').text("No programme information available.")
        }
        $('#select2search').select2('data', null);
    }

    function getContext(data) {
        var assessmentsArray = data.features;
        var groupedByClass = _.groupBy(assessmentsArray, function(assessment) {
            return assessment.studentgroup;
        });
        _.each(_(groupedByClass).keys(), function(className) {
            groupedByClass[className] = getClassContext(groupedByClass[className]);
        });
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
        var genders = [];
        for (var j=0, length=assessmentData.singlescoredetails.gender.length; j < length; j++) {
            var scoreDetails = assessmentData.singlescoredetails.gender[j];
            var cohortsDetails = assessmentData.cohortsdetails.gender[j];
            var gender = {
                'name': scoreDetails.sex == 'male' ? 'Boys' : 'Girls',
                'singlescore': scoreDetails.singlescore,
                'cohorts': cohortsDetails.total
            };
            genders.push(gender);
        }
        assessmentData.genders = genders;

        var mts = [];
        for (var i=0, length = assessmentData.cohortsdetails.mt.length; i < length; i++) {
            var mt = {
                'name': assessmentData.cohortsdetails.mt[i].mt,
                'singlescore': assessmentData.singlescoredetails.mt[i].singlescore
            };
            mts.push(mt);
        }
        assessmentData.mts = mts;

        var compares = [];
        var boundary = assessmentData.singlescoredetails.boundary;
        var boundaryKeys = _.keys(boundary);
        _.each(boundaryKeys, function(key) {

            var compareObj = {
                'type': key,
                'name': boundary[key].boundary__name,
                'singlescore': boundary[key].singlescore
            };
            compares.push(compareObj);
        });
        assessmentData.compares = compares;

        return assessmentData;
    }

})();