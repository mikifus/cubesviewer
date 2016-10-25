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


/**
 * View class, which contains view definition (params), view state,
 * and provides the view API.
 *
 * This is the generic base View class definition.
 * Specific views (ie. CubeView) enrich this model.
 *
 * @param cvOptions The cv options object.
 * @param id The numeric id of the view to be created.
 * @param type The view type (ie. 'cube').
 * @returns The new view object.
 *
 * @namespace cubesviewer
 */
cubesviewer.View = function(cvOptions, id, type) {

	var view = {};

	view.id = "_cv-view-" + id;
	view.type = type;
	view.cvOptions = cvOptions;

	view.state = cubesviewer.VIEW_STATE_INITIALIZING;
	view.error = "";

	view.params = {};

	view.savedId = 0;
	view.owner = cvOptions.user;
	view.shared = false;


	/**
	 * Returns a boolean indicating whether controls are hidden for this view.
	 *
	 * @returns boolean indicating whether controls are hidden for this view.
	 */
	view.getControlsHidden = function() {
		return !!view.params.controlsHidden || !!view.cvOptions.hideControls;
	};

	view.setControlsHidden = function(controlsHidden) {
		view.params.controlsHidden = controlsHidden;
	};

    view.getEnabledDrilldowns = function () {
        return view.getEnabledDimensions('selectDrill');
    };

    view.setEnabledDrilldowns = function (dimensions) {
        view.setEnabledDimensions(dimensions, 'selectDrill');
    };

    view.getEnabledFilters = function () {
        return view.getEnabledDimensions('cv-view-show-dimensionfilter');
    };

    view.setEnabledFilters = function (dimensions) {
        view.setEnabledDimensions(dimensions, 'cv-view-show-dimensionfilter');
    };

    view.getEnabledHorizontalDimensions = function () {
        return view.getEnabledDimensions('cv-view-series-setxaxis');
    };

    view.setEnabledHorizontalDimensions = function (dimensions) {
        view.setEnabledDimensions(dimensions, 'cv-view-series-setxaxis');
    };

    view.getEnabledMeasures = function () {
        var enabled_measures = [];
        if (view.params.enabled_controls) {
            enabled_measures = view.params.enabled_controls['measures'];
        }

        if (!enabled_measures || enabled_measures.length == 0) {
            return view.cube.measures;
        } else {
            return $.grep(view.cube.measures, function (d) {
                return enabled_measures.indexOf(d.name) != -1;
            });
        }
    };

    view.setEnabledMeasures = function(dimensions) {
        view.setEnabledDimensions(dimensions, 'measures');
    };

    view.getEnabledAggregates = function () {
        var enabled_aggregates = [];
        if (view.params.enabled_controls) {
            enabled_aggregates = view.params.enabled_controls['cv-view-series-setyaxis'];
        }

        if (!enabled_aggregates || enabled_aggregates.length == 0) {
            return view.cube.aggregates;
        } else {
            return $.grep(view.cube.aggregates, function (d) {
                return enabled_aggregates.indexOf(d.name) != -1;
            });
        }
    };

    view.setEnabledAggregates = function(dimensions) {
        view.setEnabledDimensions(dimensions, 'cv-view-series-setyaxis');
    };

    view.getEnabledDimensions = function (label) {
        var enabled_dimensions = [];
        if (view.params.enabled_controls) {
            enabled_dimensions = view.params.enabled_controls[label];
        }

        if (!enabled_dimensions || enabled_dimensions.length == 0) {
            return view.cube.dimensions;
        } else {
            return $.grep(view.cube.dimensions, function (d) {
                return enabled_dimensions.indexOf(d.name) != -1;
            });
        }
    };

    view.setEnabledDimensions = function (dimensions, label) {
        var ret = [];
        dimensions.forEach(function (d) {
            if (d.selected) ret.push(d.name);
        });
        if (!view.params['enabled_controls']) {
            view.params['enabled_controls'] = {};
        }
        view.params.enabled_controls[label] = ret;
    };

    return view;

};



/**
 * The views module manages different views in CubesViewer.
 *
 * @namespace cv.views
 */
angular.module('cv.views', ['cv.views.cube']);


/**
 * This service manages CubesViewer views in the application.
 *
 * @class viewsService
 * @memberof cv.views
 */
angular.module('cv.views').service("viewsService", ['$rootScope', '$window', 'cvOptions', 'cubesService', 'dialogService',
                                                    function ($rootScope, $window, cvOptions, cubesService, dialogService) {

	this.views = [];

	this.lastViewId = 0;

	this.studioViewsService = null;

	/**
	 * Adds a new clean view for a cube.
	 *
	 * @param type Type of view to create. Currently only "cube" is available.
	 * @param data View parameters, as an object or as a serialized JSON string.
	 * @returns CubesViewer view object.
	 *
	 * @memberOf cv.views.viewsService
	 */
	this.createView = function(type, data) {

		// Create view

		this.lastViewId++;

		var params = {};

		if (typeof data == "string") {
			try {
				params = $.parseJSON(data);
			} catch (err) {
				console.debug('Error: could not process serialized data (JSON parse error)');
				dialogService.show('Error: could not process serialized data (JSON parse error).')
				params["name"] = "Undefined view";
			}
		} else {
			params = data;
		}

		// FIXME: cvOptions shall not be passed, and getControlsHidden() shall possibly be part of this view service
		var view = cubesviewer.CubeView(cvOptions, this.lastViewId, type);
		$.extend(view.params, params);

		return view;
	};

	/**
	 * Serialize view data.
	 *
	 * @param view The view object for which definition will be serialized.
	 * @returns A string with the definition of the view (view.params) serialized in JSON.
	 */
	this.serializeView = function(view) {
		//return JSON.stringify(view.params);
		return angular.toJson(view.params);  // Ignores $$ attributes
	};


}]);


