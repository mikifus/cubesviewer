/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*
 * Series chart object. Contains view functions for the 'chart' mode.
 * This is an optional component, part of the cube view.
 */

"use strict";

angular.module('cv.views.cube').controller("CubesViewerWidgetThresholdController",
    ['$rootScope', '$scope', '$element', '$timeout', 'cvOptions', 'cubesService', 'viewsService',
        function ($rootScope, $scope, $element, $timeout, cvOptions, cubesService, viewsService) {

            $scope.initialize = function () {
                $scope.view.params.widget = $.extend(
                    {},
                    {
                        "threshold": 90
                    },
                    $scope.view.params.widget
                );
                //$scope.refreshView();
            };

            $scope.$on('gridDataUpdated', function () {
                $scope.drawWidgetThreshold();
            });

            $scope.$watch('view.params.widget.threshold', function () {
                $scope.drawWidgetThreshold();
            });

            $scope.drawWidgetThreshold = function () {

                var view = $scope.view;
                var dataRows = $scope.view.grid.data;
                var columnDefs = view.grid.columnDefs;
                var zaxis = view.params.zaxis;

                $scope.view.zaxis_compare = null;
                $scope.series = null;

                if (!zaxis) {
                    return;
                }
                var zparts = view.cube.dimensionParts(zaxis);

                var d = [];

                var serieCount = 0;
                var zkeys = [];
                $(dataRows).each(function (idx, e) {
                    var zinfos = zparts.hierarchy.readCell(e['_cells'][Object.keys(e['_cells'])[0]], zparts.level);
                    var zdrilldownLevelLabels = [];
                    $(zinfos).each(function (idx, info) {
                        zdrilldownLevelLabels.push(info.label);
                    });
                    var zkey = zdrilldownLevelLabels.join(' / ');
                    if (zkeys.indexOf(zkey) == -1) zkeys.push(zkey);
                    var serie = [];
                    for (var i = 1; i < columnDefs.length; i++) {
                        var value = e[columnDefs[i].name];
                        serie.push({"x": columnDefs[i].name, "y": (value != undefined) ? value : 0});
                    }
                    var series = {"values": serie, "key": e["key"] != "" ? e["key"] : view.params.yaxis, "zkey": zkey};
                    if (view.params["chart-disabledseries"]) {
                        if (view.params["chart-disabledseries"]["key"] == (view.params.drilldown.join(","))) {
                            series.disabled = !!view.params["chart-disabledseries"]["disabled"][series.key];
                        }
                    }
                    d.push(series);
                    serieCount++;
                });
                d.sort(function (a, b) {
                    return a.key < b.key ? -1 : (a.key > b.key ? +1 : 0)
                });

                zkeys.sort();
                var prev_key = zkeys.slice(-2)[0];
                var current_key = zkeys.slice(-2)[1];
                if (!current_key) {
                    current_key = prev_key;
                }

                if (prev_key && current_key) {
                    $scope.view.zaxis_compare = prev_key + ' – ' + current_key;
                }

                var prev_series = $.grep(d, function (serie) {
                    return serie.zkey == prev_key;
                });

                var curr_series = $.grep(d, function (serie) {
                    return serie.zkey == current_key;
                });

                $(curr_series).each(function (i, serie) {
                    var prev_values = $.grep(prev_series, function (ps) {
                        return ps.key == serie.key;
                    });
                    if (prev_values.length > 0) {
                        prev_values = prev_values[0]['values'];
                        var filtered_values = [];
                        $(serie['values']).each(function (i, v) {
                            var diff;
                            if (prev_values[i]['y'] == 0 && v['y'] == 0) {
                                diff = 0;
                            }
                            else if (v['y'] == 0) {
                                diff = -100;
                            } else {
                                diff = $scope.toFixed((v['y'] - prev_values[i]['y']) / v['y'] * 100, 1);
                            }
                            if (v['y'] >= view.params.widget.threshold) {
                                filtered_values.push({
                                    'x': $scope.toFixed(v['x'], 2),
                                    'y': $scope.toFixed(v['y'], 2),
                                    'prev': prev_values[i]['y'],
                                    'diff': diff
                                });
                            }
                        });
                        serie['values'] = filtered_values;
                    }

                    var sort_values = serie['values'].slice(0);
                    sort_values.sort(function (a, b) {
                        return a.y > b.y ? -1 : (a.y < b.y ? +1 : 0);
                    });

                    serie['values'] = serie['values'].filter(function (v) {
                        return sort_values.indexOf(v) != -1;
                    });
                });
                $scope.series = curr_series;
            };

            $scope.initialize();
        }]);


