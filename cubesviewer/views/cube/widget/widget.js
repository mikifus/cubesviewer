/**
 * Created by itux on 01/11/2016.
 */
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

"use strict";

/*
 * Series chart object. Contains view functions for the 'chart' mode.
 * This is an optional component, part of the cube view.
 */

angular.module('cv.views.cube').controller("CubesViewerWidgetController", ['$rootScope', '$scope', '$timeout', '$element', 'cvOptions', 'cubesService', 'viewsService', 'seriesOperationsService', 'exportService',
    function ($rootScope, $scope, $timeout, $element, cvOptions, cubesService, viewsService, seriesOperationsService, exportService) {

        $scope.initialize = function () {
            // Add widget view parameters to view definition
            $scope.view.params = $.extend(
                {},
                {
                    "zaxis": null,
                    "widget": {
                        "type": "max-value",
                        'zoom': null
                    }
                },
                $scope.view.params
            );
            $scope.zaxis = $scope.view.params.zaxis;
            if ($scope.view.params.widget.type == 'value') {
                $scope.zaxis = null;
            }
            //$scope.refreshView();
        };
        $scope.$watch("view.params.widget.type", function () {
            $scope.loadData();
        });
        $scope.$on("ViewRefresh", function (view) {
            $scope.loadData();
        });

        $scope.loadData = function () {
            $scope.zaxis = $scope.view.params.zaxis;
            if ($scope.zaxis == null) {
                return;
            }
            var includeXAxis = $scope.view.params.xaxis != null;
            var includeZAxis = $scope.zaxis != null;
            var browser_args = cubesService.buildBrowserArgs($scope.view, includeXAxis, false, includeZAxis);
            var browser = new cubes.Browser(cubesService.cubesserver, $scope.view.cube);
            var viewStateKey = $scope.newViewStateKey();
            var jqxhr = browser.aggregate(browser_args, $scope._loadDataCallback(viewStateKey));

            $scope.view.pendingRequests++;
            jqxhr.always(function () {
                $scope.view.pendingRequests--;
                $rootScope.$apply();
            });
            jqxhr.error($scope.requestErrorHandler);

        };

        $scope._loadDataCallback = function (viewStateKey) {
            return function (data, status) {
                // Only update if view hasn't changed since data was requested.
                if (viewStateKey == $scope._viewStateKey) {
                    $scope.validateData(data, status);
                    $scope.processData(data);
                    $rootScope.$apply();
                }
            };
        };

        $scope.processData = function (data) {

            if ($scope.view.pendingRequests == 0) {
            }

            $scope.rawData = data;

            $scope.resetGrid();
            $scope.view.grid.data = [];
            $scope.view.grid.columnDefs = [];
            $rootScope.$apply();

            var view = $scope.view;
            var rows = $scope.view.grid.data;
            var columnDefs = view.grid.columnDefs;

            // Process data
            $scope._addRows($scope, data, $scope.zaxis);
            seriesOperationsService.applyCalculations($scope.view, $scope.view.grid.data, view.grid.columnDefs);

            var drilldown = view.params.drilldown.slice(0);

            if ($scope.zaxis) {
                drilldown.splice(0, 0, $scope.zaxis);
            }
            // Join keys
            if (drilldown.length > 0) {
                columnDefs.splice(0, drilldown.length, {
                    name: "key"
                });

                $(rows).each(function (idx, e) {
                    var jointkey = [];
                    for (var i = 0; i < drilldown.length; i++) {
                        if (drilldown[i] != $scope.zaxis) {
                            jointkey.push(e["key" + i]);
                        }
                    }
                    if (jointkey.length > 0) {
                        e["key"] = jointkey.join(" / ");
                    } else {
                        e["key"] = null;
                    }
                });
            }
            $scope.$broadcast("gridDataUpdated");
        };

        /*
         * Adds rows.
         */
        $scope._addRows = cubesviewer._seriesAddRows;

        /**
         * Note that `this` refers to the view in this context.
         */

        $scope.$on("$destroy", function () {
            $scope.view.grid.data = [];
            $scope.view.grid.columnDefs = [];
        });

        $scope.initialize();

        $scope.diff_abs = function (num) {
            if (num || num == 0) {
                return Math.abs(num).toFixed(1);
            } else {
                return 0;
            }
        };

        $scope.toFixed = function (n, digits) {
            if (typeof n == 'number') {
                return parseFloat(n).toFixed(digits);
            } else {
                return n;
            }
        };

    }]);