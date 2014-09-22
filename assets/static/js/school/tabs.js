'use strict';
(function() {
    var t = klp.tabs = {};
    var templates = {};
    var dataCache = {};
    var schoolInfoURL;
    var tabs;
    var currentTab;
    var container_width = 960;
    var chart_gradient_param = [0, 0, 0, 300];

    t.init = function() {
        schoolInfoURL = 'schools/school/' + SCHOOL_ID;
   
        tabs = {
            'info': {
                getData: function() {
                    return klp.api.do(schoolInfoURL);
                },
                getContext: function(data) {
                    return data;
                },
                onRender: function(data) {
                    $('a.gallery').colorbox();
                    console.log("post render info");
                }
            },
            'demographics': {
                getData: function() {
                    return klp.api.do(schoolInfoURL + '/demographics');
                },
                getContext: function(data) {
                    var d = klp.utils.addSchoolContext(data);
                     //console.log("data", data);
                    return d;
                },
                onRender: function(data) {
                    //console.log("onrender", data);
                    $('#num_students_piechart').boyGirlChart(data);
                }
            },
            'programmes': {
                getData: function() {
                    return klp.api.do(schoolInfoURL + '/programmes');
                }
            },
            'finances': {
                getData: function() {
                    return klp.api.do(schoolInfoURL + '/finance');
                },
                getContext: function(data) {
                    data.sg_amount = data.sg_amount ? data.sg_amount : 0;
                    data.smg_amount = data.smg_amount ? data.smg_amount : 0;
                    data.tlm_amount = data.tlm_amount ? data.tlm_amount : 0;
                    data.total_amount = data.sg_amount + data.smg_amount + data.tlm_amount;
                    return data;
                },
                onRender: function(data) {
                    var container_width = $(document).find(".container:first").width();
                    var chartData = klp.utils.getFinancePercents(data);
                    var chartOptions = {
                        width: container_width,
                        height: 200,
                        innerSize: '60%'
                    }; 
                    $('#pie_chart_finance').financeChart(chartData, chartOptions);
                }
            },
            'infrastructure': {
                getData: function() {
                    return klp.api.do(schoolInfoURL + '/infrastructure');
                }
            },
            'library': {
                getData: function() {
                    return klp.api.do(schoolInfoURL + '/library');
                },

                getContext: function(data) {
                    // Step 0: Check if library data exists.
                    data.years = [];
                    data.klasses = [];
                    data.lib_borrow_agg.forEach(function (element, index) {
                        data.years.push(element.trans_year);
                        data.klasses.push(element.class_name);
                    });
                    _.each(data.lib_lang_agg, function(element, index) {
                        element.forEach(function(element, index) {
                            data.years.push(element.year);
                            data.klasses.push(element.class_name);
                        });
                    });
                    _.each(data.lib_level_agg, function(element, index) {
                        element.forEach(function(element, index) {
                            data.years.push(element.year);
                            data.klasses.push(element.class_name);
                        });
                    });

                    // Step 1: Array of years.
                    data.years = _.uniq(data.years).sort();

                    // Step 2: Array of classes.
                    data.klasses = _.uniq(_.map(data.klasses, function (klass) {
                        return String(klass);
                    })).sort();

                    // Step 3: Array of levels.
                    data.levels = _.keys(data.lib_level_agg);

                    // Step 4: Array of languages.
                    data.languages = _.keys(data.lib_lang_agg);

                    console.log('years', data.years);
                    console.log('klasses', data.klasses);
                    console.log('levels', data.levels);
                    console.log('languages', data.languages);
                    return data;
                },
                onRender: function(data) {
                    if (data.years.length === 0 || data.klasses.length === 0 || data.levels.length === 0) {
                        $(".options-wrapper").addClass('hide');
                        $("#graph_library").addClass('hide');
                        $('.no-data').removeClass('hide');
                        return;
                    }
                    $(".apply-selectboxit").selectBoxIt();
                    var $selectLibraryParam = $("#select_library_browse");
                    var $selectLibraryYear = $("#select_library_year");
                    var $selectLibraryClass = $("#select_library_class");

                    $selectLibraryParam.on('change', drawChart);
                    $selectLibraryYear.on('change', drawChart);
                    $selectLibraryClass.on('change', drawChart);
                    
                    function drawChart() {
                        var libraryParam = $selectLibraryParam.val();
                        var libraryYear = $selectLibraryYear.val();
                        var libraryClass = $selectLibraryClass.val();
                        $('#graph_library').libraryChart(data, {'parameter': libraryParam, 'year': libraryYear, 'klass': libraryClass});
                    }

                    drawChart();
                }
            },
            'nutrition': {
                getData: function() {
                    return klp.api.do(schoolInfoURL + '/nutrition');
                },

                getContext: function(data) {
                    data.hasData = true;
                    if (_.isEmpty(data.mdm_agg)) {
                        data.hasData = false;
                        return data;
                    }
                    data.indent = [];
                    data.attendance = [];
                    data.categories = [];
                    // console.log('could be array', _.toArray(data));
                    data.mdm_agg.forEach(function(element, index) {
                        data.categories.push(element.mon+ ' week ' + element.wk);
                        data.indent.push(element.indent);
                        data.attendance.push(element.attend);
                    });
                    return data;
                },

                onRender: function(data) {
                    if (data.hasData) {
                        $('.data').removeClass('hide');
                        $('#graph_nutrition').highcharts({
                            chart: {
                                type: 'area',
                                width: container_width,
                                height: klp.utils.getRelativeHeight(960,400, 230, container_width)
                            },
                            title:{
                                text: null
                            },
                            subtitle: {
                                text: "Food Indent vs Attendance Tracking"
                            },
                            xAxis: {
                                categories: data.categories,
                                tickInterval: 2
                                // allowDecimals: false,
                                // labels: {
                                //     formatter: function() {
                                //         return this.value; // clean, unformatted number for year
                                //     }
                                // }
                            },
                            yAxis: {
                                title: {
                                    text: 'Number of children'
                                },
                                labels: {
                                    formatter: function() {
                                        return this.value;
                                        // return this.value / 1000 +'k';
                                    }
                                }
                            },
                            credits:{
                                enabled:false
                            },
                            tooltip: {
                                // pointFormat: '{series.name} produced <b>{point.y:,.0f}</b><br/>warheads in {point.x}'
                            },
                            plotOptions: {
                                area: {
                                    fillOpacity:1
                                }
                            },
                            series: [{
                                name: 'Indent',
                                data: data.indent,
                                color: '#56af31',
                                fillColor: {
                                    linearGradient: chart_gradient_param,
                                    stops: [
                                        [0, '#e5f3e0'],
                                        [1, 'rgba(255,255,255,0.3)']
                                    ]
                                }
                            }, {
                                name: 'Attendance',
                                data: data.attendance,
                                color: '#3892e3',
                                fillColor: {
                                    linearGradient: chart_gradient_param,
                                    stops: [
                                        [0, '#92c3ef'],
                                        [1, 'rgba(255,255,255,0.3)']
                                    ]
                                }
                            }]
                        });
                    } else {
                        $('.no-data').removeClass('hide');
                    }
                }
            },
            'share-story': {
                getData: function() {
                    //FIXME: replace with real SYS end-point
                    return klp.api.do(schoolInfoURL);
                }
            },
            'volunteer': {
                getData: function() {
                    var url = "volunteer_activities";
                    var params = {
                        school: SCHOOL_ID
                    };
                    return klp.api.do(url, params);
                },
                onRender: function(data) {
                    klp.volunteer_here.checkSelf(data.features);
                }
            }

        };


        //compile templates for tabs
        _(_(tabs).keys()).each(function(tabName) {
            console.log("tab name", tabName);
            var templateString = $('#tpl-tab-' + tabName).html();
            templates[tabName] = swig.compile(templateString);
        });

        $(document).on("click", ".js-tab-link", function(e){
            var $wrapper = $(".js-tabs-wrapper");
            var $trigger = $(this).closest(".js-tab-link");
            var tab_id = $trigger.attr('data-tab');

            //show tab
            t.showTab(tab_id);

        });

        var queryParams = klp.router.getHash().queryParams;
        if (queryParams.hasOwnProperty('tab') && queryParams['tab'] in tabs) {
            var firstTab = queryParams['tab'];
        } else {
            var firstTab = 'info';
        }

        var tabDeferred = t.showTab(firstTab);
        klp.router.events.on('hashchange:tab', function(e, params) {
            console.log("hashchange:tab", params);
            var queryParams = params.queryParams;
            if (queryParams['tab'] in tabs) {
                t.showTab(queryParams['tab']);
            }
        });

        //slightly ugly hack to lazy load all tabs only on mobile
        //FIXME: possibly, get "isMobile" somewhere else, not sure
        //checking for < 768 on page load is the best technique.
        if ($(window).width() < 768) {
            tabDeferred.done(function() {
                var allTabs = _(tabs).keys();
                var tabsToLoad = _(allTabs).without(firstTab);
                _(tabsToLoad).each(function(tabName) {
                    t.showTab(tabName);
                });
            });
        }
        console.log(templates);

    };

    t.showTab = function(tabName) {
        if (currentTab === tabName) {
            return;
        }
        $('.tab-content.current').removeClass('current');
        var queryParams = klp.router.getHash().queryParams;
        if (!(queryParams.hasOwnProperty('tab') && queryParams['tab'] === tabName)) {
            klp.router.setHash(null, {'tab': tabName}, {trigger: false});
        }
        currentTab = tabName;
        var $tabButton = $('.js-tab-link[data-tab=' + tabName + ']');
        $tabButton.parent().find("li.current").removeClass('current');
        $tabButton.addClass("current");
        $('div[data-tab=' + tabName + ']').addClass('current');
        var $deferred = $.Deferred();
        getData(tabName, function(data) {
            if (tabs[tabName].hasOwnProperty('getContext')) {
                data = tabs[tabName].getContext(data);
            }
            var html = templates[tabName](data);
            //$('#loadingTab').removeClass('current');
            $('div[data-tab=' + tabName + ']').html(html);
            doPostRender(tabName, data);
            $deferred.resolve();
        });
        return $deferred;
    };

    function getData(tabName, callback) {
        if (dataCache.hasOwnProperty(tabName)) {
            callback(dataCache[tabName]);
            return;
        }
        var $xhr = tabs[tabName].getData();
        $xhr.done(function(data) {
            dataCache[tabName] = data;
            callback(data);
        });
    }

    function doPostRender(tabName, data) {
        if (tabs[tabName].hasOwnProperty('onRender')) {
            tabs[tabName].onRender(data);
        }
    }

})();