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


/**
 */

"use strict";

angular.module('cv.views.cube').controller("CubesViewerViewsCubeRangeFilterDimensionController",
    ['$rootScope', '$scope', '$filter', 'cvOptions', 'cubesService', 'viewsService',
        function ($rootScope, $scope, $filter, cvOptions, cubesService, viewsService) {

            $scope.parts = null;
            $scope.rangeFrom = '';
            $scope.rangeTo = '';

            $scope.currentDataId = null;

            $scope.initialize = function () {
            };

            $scope.$watch("view.dimensionRangeFilter", function () {
                $scope.parts = $scope.view.cube.dimensionParts($scope.view.dimensionRangeFilter);
                if ($scope.view.params.rangefilters) {
                    $scope.view.params.rangefilters.forEach(function (rangefilter) {
                        if (rangefilter.dimension == $scope.parts.dimension.name) {
                            $scope.rangeFrom = rangefilter.range_from;
                            $scope.rangeTo = rangefilter.range_to;
                        }
                    });
                } else {
                    $scope.view.params.rangefilters = [{
                        'dimension': $scope.parts.dimension.name,
                        'rangeFrom': null,
                        'rangeTo': null
                    }];
                }
            });

            $scope.$on("ViewRefresh", function (view) {
                //$scope.loadDimensionValues();
            });

            $scope.closeDimensionFilter = function () {
                $scope.view.dimensionRangeFilter = null;
            };

            /*
             * Updates info after loading data.
             */
            $scope.applyFilter = function () {
                // Cut dimension
                var cutDimension = $scope.parts.dimension.name
                    + ( $scope.parts.hierarchy.name != "default" ? "@" + $scope.parts.hierarchy.name : "" )
                    + ':' + $scope.parts.level.name;
                $scope.selectRange(cutDimension, $scope.rangeFrom, $scope.rangeTo);

            };

            $scope.setRangeFrom = function () {
                $scope.rangeFrom = null;
                $scope.applyFilter();
            };

            $scope.setRangeTo = function () {
                $scope.rangeTo = null;
                $scope.applyFilter();
            };


            $scope.initialize();

        }]);

