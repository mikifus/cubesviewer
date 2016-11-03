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

angular.module('cv.views.cube').controller("CubesViewerWidgetMaxValueController",
    ['$rootScope', '$scope', '$element', '$timeout', 'cvOptions', 'cubesService', 'viewsService',
        function ($rootScope, $scope, $element, $timeout, cvOptions, cubesService, viewsService) {

            $scope.diff_abs = function(num){
                if (num || num == 0) {
                    return Math.abs(num).toFixed(1);
                } else {
                    return 0;
                }
            };

            $scope.series = [];

            $scope.initialize = function () {
            };

            $scope.$on('gridDataUpdated', function () {
                $scope.drawWidgetMaxDifficulty();
            });

            $scope.drawWidgetMaxDifficulty = function () {

                var view = $scope.view;
                var dataRows = $scope.view.grid.data;
                var columnDefs = view.grid.columnDefs;
                var drilldown = view.params.drilldown.slice(0);
                var zaxis = drilldown.splice(drilldown.indexOf('date@daily:day'), 1).pop();
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
                        $(serie['values']).each(function (i, v) {
                            v['prev'] = prev_values[i]['y'];
                            v['diff'] = (v['y'] - prev_values[i]['y']) / v['y'] * 100;
                        });
                    }

                    var sort_values = serie['values'].slice(0);
                    sort_values.sort(function (a, b) {
                        return a.y > b.y ? -1 : (a.y < b.y ? +1 : 0);
                    });
                    sort_values = sort_values.slice(0, 10);

                    serie['values'] = serie['values'].filter(function (v) {
                        return sort_values.indexOf(v) != -1;
                    });
                });
                $scope.series = curr_series;
            };
            $scope.initialize();
        }]);


