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

angular.module('cv.views.cube').controller("CubesViewerWidgetValueController",
    ['$rootScope', '$scope', '$element', '$timeout', 'cvOptions', 'cubesService', 'viewsService',
        function ($rootScope, $scope, $element, $timeout, cvOptions, cubesService, viewsService) {


            $scope.series = [];

            $scope.initialize = function () {
            };

            $scope.$on('gridDataUpdated', function () {
                $scope.drawWidgetValue();
            });

            $scope.drawWidgetValue = function () {

                var view = $scope.view;
                var dataRows = $scope.view.grid.data;
                var columnDefs = view.grid.columnDefs;
                var zaxis = view.params.xaxis;
                $scope.view.zaxis_compare = null;

                if (!zaxis) {
                    return;
                }

                var d = [];

                var serieCount = 0;
                var prev_cell = columnDefs.slice(-2)[0];
                var curr_cell = columnDefs.slice(-2)[1];
                $(dataRows).each(function (idx, e) {
                    var prev = $scope.toFixed(e[prev_cell.name], 2);
                    var curr = $scope.toFixed(e[curr_cell.name], 2);
                    var diff;
                    if (prev == 0 && curr == 0) {
                        diff = 0;
                    }
                    else if (curr == 0) {
                        diff = -100;
                    } else {
                        diff = $scope.toFixed((curr - prev) / curr * 100, 1);
                    }
                    var serie = {"value": curr, "diff": diff, "key": e["key"] ? e["key"] : view.params.yaxis};
                    d.push(serie);
                    serieCount++;
                });
                d.sort(function (a, b) {
                    return a.key < b.key ? -1 : (a.key > b.key ? +1 : 0)
                });
                if (prev_cell && curr_cell) {
                    $scope.view.zaxis_compare = prev_cell.name + ' – ' + curr_cell.name;
                }

                $scope.series = d;
            };
            $scope.initialize();
        }]);


