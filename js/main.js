/**
 * main.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2016, Codrops
 * http://www.codrops.com
 */
;(function(window) {

	'use strict';

	// Helper vars and functions.
	function extend(a, b) {
		for( var key in b ) { 
			if( b.hasOwnProperty( key ) ) {
				a[key] = b[key];
			}
		}
		return a;
	}
	/**
	 * Throttle fn: From https://sberry.me/articles/javascript-event-throttling-and-debouncing
	 */
	function throttle(fn, delay) {
		var allowSample = true;

		return function(e) {
			if (allowSample) {
				allowSample = false;
				setTimeout(function() { allowSample = true; }, delay);
				fn(e);
			}
		};
	}
	/**
	 * Mouse position: From http://www.quirksmode.org/js/events_properties.html#position.
	 */
	function getMousePos(e) {
		var posx = 0, posy = 0;
		if (!e) var e = window.event;
		if (e.pageX || e.pageY) 	{
			posx = e.pageX;
			posy = e.pageY;
		}
		else if (e.clientX || e.clientY) 	{
			posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		return { x : posx, y : posy };
	}
	/**
	 * Distance between two points P1 (x1,y1) and P2 (x2,y2).
	 */
	function distancePoints(x1, y1, x2, y2) {
		return Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
	}
	/**
	 * Equation of a line.
	 */
	function lineEq(y2, y1, x2, x1, currentVal) {
		// y = mx + b
		var m = (y2 - y1) / (x2 - x1),
			b = y1 - m * x1;

		return m * currentVal + b;
	}

	var docScrolls = {left : document.body.scrollLeft + document.documentElement.scrollLeft, top : document.body.scrollTop + document.documentElement.scrollTop};

	/**
	 * Point obj.
	 */
	function Point(el, bgEl, wrapper, options) {
		this.el = el;
		this.wrapper = wrapper;
		// Options/Settings.
		this.options = extend( {}, this.options );
		extend( this.options, options );
		// A Point obj has a background element (img, video, ..) and a point/position (x,y) in the canvas.
		this.bgEl = bgEl;
		// The position of the point.
		this.position = this._updatePosition();
		// When the mouse is dmax away from the point, its image gets opacity = 0.
		this.dmax = this.options.viewportFactor != -1 && this.options.viewportFactor > 0 ? this.wrapper.offsetWidth/this.options.viewportFactor : this.options.maxDistance;
		if( this.dmax < this.options.activeOn ) {
			this.options.activeOn = this.dmax-5; // todo
		}
		// Init/Bind events.
		this._initEvents();
	}

	/**
	 * Point options/settings.
	 */
	Point.prototype.options = {
		// Maximum opacity that the bgEl can have.
		maxOpacity : 1,
		// When the mouse is [activeOn]px away from the point, its image gets opacity = this.options.maxOpacity.
		activeOn : 20,
		// The distance from the mouse pointer to a Point where the opacity of the background element is 0.
		maxDistance : 100, 
		// If viewportFactor is different than -1, then the maxDistance will be overwritten by [window´s width / viewportFactor]
		viewportFactor : -1,
		onActive : function() { return false; },
		onInactive : function() { return false; },
		onClick : function() { return false; }
	};

	/**
	 * Initialize/Bind events.
	 */
	Point.prototype._initEvents = function() {
		var self = this;

		// Mousemove event.
		this._throttleMousemove = throttle(function(ev) {
			requestAnimationFrame(function() {
				// Mouse position relative to the mapEl.
				var mousepos = getMousePos(ev);
				// Calculate the opacity value.
				if( self.bgEl ) {
					// Distance from the position of the point to the mouse position.
					var distance = distancePoints(mousepos.x - docScrolls.left, mousepos.y - docScrolls.top, self.position.x - docScrolls.left, self.position.y - docScrolls.top),
						// Convert this distance to a opacity value. (distance = 0 -> opacity = 1).
						opacity = self._distanceToOpacity(distance);

					self.bgEl.style.opacity = opacity;

					// Callback
					if( !self.isActive && opacity === self.options.maxOpacity ) {
						self.options.onActive();
						self.isActive = true;
					}
					
					if( opacity !== self.options.maxOpacity && self.isActive ) {
						self.options.onInactive();
						self.isActive = false;
					}
				}
			});
		}, 20);
		this.wrapper.addEventListener('mousemove', this._throttleMousemove);

		// Clicking a point.
		this._click = function(ev) {
			// Callback.
			self.options.onClick();
		};
		this.el.addEventListener('click', this._click);

		// Window resize.
		this._throttleResize = throttle(function() {
			// Update Point´s position.
			self.position = self._updatePosition();
			// Update dmax
			if( self.options.viewportFactor != -1 && self.options.viewportFactor > 0 ) {
				self.dmax = self.wrapper.offsetWidth/self.options.viewportFactor;
			}
		}, 100);
		window.addEventListener('resize', this._throttleResize);

		// Set the opacity of the bgEl to 0 when leaving the wrapper area..
		this.wrapper.addEventListener('mouseleave', function() {
			if( !self.isActive ) {
				self.bgEl.style.opacity = 0;
			}
		});
	};

	/**
	 * Update Point´s position.
	 */
	Point.prototype._updatePosition = function() {
		var rect = this.el.getBoundingClientRect(), bbox = this.el.getBBox();
		// Also update origins..
		this.el.style.transformOrigin = this.el.style.WebkitTransformOrigin = (bbox.x + rect.width/2) + 'px ' + (bbox.y + rect.height) + 'px';
		return {x : rect.left + rect.width/2 + docScrolls.left, y : rect.top + rect.height/2 + docScrolls.top};
	};

	/**
	 * Maps the distance to opacity.
	 */
	Point.prototype._distanceToOpacity = function(d) {
		return Math.min(Math.max(lineEq(this.options.maxOpacity, 0, this.options.activeOn, this.dmax, d), 0), this.options.maxOpacity);
	};

	/**
	 * Hides the Point.
	 */
	Point.prototype.hide = function() {
		lunar.addClass(this.el, 'point--hide');
	};

	/**
	 * 
	 */
	Point.prototype.show = function() {
		lunar.removeClass(this.el, 'point--hide')
	};

	/**
	 * 
	 */
	Point.prototype.pause = function() {
		this.wrapper.removeEventListener('mousemove', this._throttleMousemove);
	};

	/**
	 * 
	 */
	Point.prototype.resume = function() {
		this.wrapper.addEventListener('mousemove', this._throttleMousemove);
	};

	/**
	 * PointsMap obj.
	 */
	function PointsMap(el, options) {
		this.el = el;
		// Options/Settings.
		this.options = extend( {}, this.options );
		extend( this.options, options );
		
		// Backgrounds container.
		this.bgsWrapper = this.el.querySelector('.backgrounds');
		if( !this.bgsWrapper ) { return; }
		
		// Background elements.
		this.bgElems = [].slice.call(this.bgsWrapper.querySelectorAll('.background__element'));
		// Total background elements.
		this.bgElemsTotal = this.bgElems.length;
		if( this.bgElemsTotal <= 1 ) { return; }
		
		// Points container.
		this.pointsWrapper = this.el.querySelector('.points');
		if( !this.pointsWrapper || getComputedStyle(this.pointsWrapper, null).display === 'none' ) { return; }

		// Points tooltips
		this.tooltips = [].slice.call(this.el.querySelector('.points-tooltips').children);

		// Points´s content
		this.pointsContentWrapper = this.el.querySelector('.points-content');
		this.contents = [].slice.call(this.pointsContentWrapper.children);

		// Init..
		this._init();
	}

	/**
	 * PointsMap options/settings.
	 */
	PointsMap.prototype.options = {
		// Maximum opacity that the background element of a Point can have when the point is active (mouse gets closer to it).
		maxOpacityOnActive : 0.3,
		// The distance from the mouse pointer to a Point where the opacity of the background element is 0.
		maxDistance : 100, 
		// If viewportFactor is different than -1, then the maxDistance will be overwritten by [point´s parent width / viewportFactor]
		viewportFactor : 9,
		// When the mouse is [activeOn]px away from one point, its image gets opacity = point.options.maxOpacity.
		activeOn : 30
	};

	/**
	 * Init.
	 */
	PointsMap.prototype._init = function() {
		var self = this, 
			onLoaded = function() {
				// Create the Points.
				self._createPoints();
			};

		// Preload all images.
		imagesLoaded(this.bgsWrapper, { background: true }, onLoaded);

		// Init/Bind events.
		this._initEvents();
	};

	/**
	 * Init/Bind events.
	 */
	PointsMap.prototype._initEvents = function() {
		var self = this;

		// Window resize.
		this._throttleResize = throttle(function() {
			// Update Document scroll values.
			docScrolls = {left : document.body.scrollLeft + document.documentElement.scrollLeft, top : document.body.scrollTop + document.documentElement.scrollTop};
		}, 100);
		window.addEventListener('resize', this._throttleResize);

		// Close content.
		this._closeContent = function() {
			var currentPoint = self.points[self.currentPoint];
			currentPoint.isActive = false;
			// Hide Point´s bgEl.
			currentPoint.bgEl.style.opacity = 0;
			// Hide content.
			self.pointsContentWrapper.classList.remove('points-content--open');
			self.contents[self.currentPoint].classList.remove('point-content--current');
			// Start mousemove event on Points.
			self._pointsAction('resume');
			// Show all points.
			self._pointsAction('show');
		};
		this.pointsContentWrapper.addEventListener('click', this._closeContent);

		// Keyboard navigation events.
		this.el.addEventListener('keydown', function(ev) {
			var keyCode = ev.keyCode || ev.which;
			if( keyCode === 27 ) {
				self._closeContent();
			}
		});
	};

	/**
	 * Create the Points.
	 */
	PointsMap.prototype._createPoints = function() {
		this.points = [];

		var self = this;
		[].slice.call(this.pointsWrapper.querySelectorAll('.point')).forEach(function(point, pos) {
			var p = new Point(point, self.bgElems[pos], self.el, {
				maxOpacity : self.options.maxOpacityOnActive, 
				activeOn : self.options.activeOn, 
				maxDistance : self.options.maxDistance, 
				viewportFactor : self.options.viewportFactor, 
				onActive : function() {
					// Add class active (scales up the pin and changes the fill color).
					lunar.addClass(self.points[pos].el, 'point--active');
					// Hide all other points.
					self._pointsAction('hide', pos);
					// Show tooltip.
					var tooltip = self.tooltips[pos];
					tooltip.classList.add('point-tooltip--current');
					// Position tooltip.
					var rect = self.points[pos].el.getBoundingClientRect(),
						bounds = self.el.getBoundingClientRect();

					tooltip.style.left = rect.left - bounds.left + rect.width/2 + 'px';
					tooltip.style.top = rect.top - bounds.top + rect.height + 'px';
				},
				onInactive : function() {
					lunar.removeClass(self.points[pos].el, 'point--active');
					// Show all points.
					self._pointsAction('show', pos);
					// Hide tooltip.
					self.tooltips[pos].classList.remove('point-tooltip--current');
				},
				onClick : function() {
					self.currentPoint = pos;
					lunar.removeClass(self.points[pos].el, 'point--active');
					// Hide the current point (and all other points).
					self._pointsAction('hide');
					// Hide tooltip.
					self.tooltips[pos].classList.remove('point-tooltip--current');
					// Stop mousemove event on Points.
					self._pointsAction('pause');
					// Show Point´s bgEl.
					self.points[pos].bgEl.style.opacity = 1;
					// Show content.
					self.pointsContentWrapper.classList.add('points-content--open');
					self.contents[pos].classList.add('point-content--current');
				}
			});
			self.points.push(p);
		});	
	};

	/**
	 * Calls a Point´s fn. Excludes the point with index = excludedPoint.
	 */
	PointsMap.prototype._pointsAction = function(action, excludedPoint) {
		for(var i = 0, len = this.points.length; i < len; ++i) {
			if( i !== excludedPoint ) {
				this.points[i][action]();
			}
		}
	};

	window.PointsMap = PointsMap;
	document.documentElement.className = 'js';

})(window);