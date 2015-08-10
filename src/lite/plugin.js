/*
Copyright 2015 LoopIndex, This file is part of the Track Changes plugin for CKEditor.

The track changes plugin is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License, version 2, as published by the Free Software Foundation.
This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU Lesser General Public License along with this program as the file lgpl.txt. If not, see http://www.gnu.org/licenses/lgpl.html.

Written by (David *)Frenkiel - https://github.com/imdfl
*/
(function(CKEDITOR) {

	"use strict";

	/**
	 * @class LITE
	 * @singleton
	 * The LITE namespace
	 */
	var LITE = {
			/**
			 * @class LITE.Events
			 */
		Events : {
			/**
			 * @member LITE.Events
			 * @event INIT
			 * string value: "lite:init"
			 * @param {LITE.LITEPlugin} an instance of a lite object associated with a ckeditor instance
			 */
			INIT : "lite:init",
			/**
			 * @member LITE.Events
			 * @event ACCEPT
			 * string value: "lite:accept"
			 * @param {Object} An object with the fields
			 * <ul><li><code>options</code> passed to the accept method
			 * <li><code>lite</code>The LITE instance with which this event is associated
			 * </ul>
			 */
			ACCEPT : "lite:accept",
			/**
			 * @member LITE.Events
			 * @event REJECT
			 * string value: "lite:reject"
			 * @param {Object} An object with the fields
			 * <ul><li><code>options</code> passed to the reject method
			 * <li><code>lite</code>The LITE instance with which this event is associated
			 * </ul>
			 */
			REJECT : "lite:reject",
			/**
			 * @member LITE.Events
			 * @event SHOW_HIDE
			 * string value: "lite:showHide"
			 * @param {Object} An object with the fields
			 * <ul><li><code>show</code> indicating the new change tracking show status
			 * <li><code>lite</code>The LITE instance with which this event is associated
			 * </ul>
			 */
			SHOW_HIDE : "lite:showHide",
			/**
			 * @member LITE.Events
			 * @event TRACKING
			 * string value: "lite:tracking"
			 * @param {Object} An object with the fields 
			 * <ul><li><code>tracking</code> indicating the new tracking status
			 * <li><code>lite</code>The LITE instance with which this event is associated
			 * </ul>
			 */
			TRACKING : "lite:tracking",
			
			/**
			 * @member LITE.Events
			 * @event CHANGE
			 * string value: "lite:change"
			 * @param {Object} An object with the fields 
			 * <ul><li><code>lite</code>The LITE instance with which this event is associated
			 * </ul>
			 */
			CHANGE : "lite:change",

			/**
			 * @member LITE.Events
			 * @event HOVER_IN
			 * string value: "lite:hover-in"
			 * @param {Object} An object with the fields 
			 * <ul><li><code>lite</code>The LITE instance with which this event is associated
			 * <li><code>node</code>The DOM node hovered
			 * <li><code>changeId</code>The relevant change id
			 * </ul>
			 */
			HOVER_IN: "lite:hover-in",

			/**
			 * @member LITE.Events
			 * @event HOVER_OUT
			 * string value: "lite:hover-out"
			 * @param {Object} An object with the fields 
			 * <ul><li><code>lite</code>The LITE instance with which this event is associated
			 * <li><code>node</code>The DOM node hovered
			 * <li><code>changeId</code>The relevant change id
			 * </ul>
			 */
			HOVER_OUT: "lite:hover-out"
		},
		
		Commands : {
			TOGGLE_TRACKING : "lite-toggletracking",
			TOGGLE_SHOW : "lite-toggleshow",
			ACCEPT_ALL : "lite-acceptall",
			REJECT_ALL : "lite-rejectall",
			ACCEPT_ONE : "lite-acceptone",
			REJECT_ONE : "lite-rejectone",
			TOGGLE_TOOLTIPS: "lite-toggletooltips"
		}
	},
	
	tooltipDefaults = {
		show: true,
		path: "js/opentip-adapter.js",
		classPath: "OpentipAdapter",
		cssPath: "css/opentip.css",
		delay: 500
	},
	
	defaultTooltipTemplate = "%a " + LITE_LABELS.BY + " %u %t",
	
	_emptyRegex = /^[\s\r\n]*$/, // for getting the clean text
		_cleanRE = [
		            {regex: /[\s]*title=\"[^\"]+\"/g, replace: "" },
		            {regex: /[\s]*data-selected=\"[^\"]+\"/g, replace:""}
		],
	
	_pluginMap = [],
	
	cutKeystrokes = [CKEDITOR.CTRL + 88,  // CTRL+X
			CKEDITOR.CTRL + 120,
			CKEDITOR.SHIFT + 46],
	_inited = false,
	isOldCKEDITOR = false;

	
	function cleanNode(node) {
		var ret, name, parent,
			i, len, child;
		if (node.nodeType === ice.dom.ELEMENT_NODE) {
			var children = node.childNodes;
			for (i = 0; i < children.length; ++i) {
				child = children[i];
				cleanNode(child);
				name = child.nodeName.toLowerCase();
				if (name === 'ins' || name === 'del') {
					while (child.firstChild) {
						node.insertBefore(child.firstChild, child);
					}
					node.removeChild(child);
				}
			}
		}
		name = node.nodeName.toLowerCase();
		if (name === 'ins' || name === 'del') {
			ret = jQuery.makeArray(node.childNodes);
		}
		else {
			ret = [node];
		}
		return ret;
	}
	
	function cleanClipboard(nodes) {
		if (! nodes ||! nodes.length) {
			return [];
		}
		var ret = [];
		nodes.forEach(function(node) {
			ret = ret.concat(cleanNode(node));
		});
		
		return ret;
	}
	
	function isCutKeystroke(code) {
		return cutKeystrokes.indexOf(code) >= 0;
	}
	
	function nodeToDOMNode(node) {
		if (node && node.$ && (typeof node.getDocument === "function")) {
			return node.$;
		}
		return node;
	}
	
	function _findPluginIndex(editor) {
		for (var i = _pluginMap.length; i--;) {
			var rec = _pluginMap[i];
			if (rec.editor == editor) {
				return i;
			}
		}
		return -1;
	}
	
	function _findPluginRec (editor) {
		var ind = _findPluginIndex(editor);
		return ind >= 0 ? _pluginMap[ind] : null;
	}
	
	function _findPlugin(editor) {
		var rec = _findPluginRec(editor);
		return rec && rec.plugin;
	}
	
	function addPlugin(editor, plugin) {
		_pluginMap.push({
			plugin: plugin,
			editor : editor
		});
	}

	function padString(s, length, padWith, bSuffix) {
		if (null === s || (typeof(s) == "undefined")) {
			s = "";
		}
		else {
			s = String(s);
		}
		padWith = String(padWith);
		var padLength = padWith.length;
		for (var i = s.length; i < length; i += padLength) {
			if (bSuffix) {
				s += padWith;
			}
			else {
				s = padWith + s;
			}
		}
		return s;
	}
	
	function padNumber(s, length) {
		return padString(s, length, '0');
	}
	
	function relativeDateFormat(date) {
		var now = new Date(),
			today = now.getDate(),
			month = now.getMonth(),
			year = now.getFullYear(),
			minutes, hours;
		
		var t = typeof(date);
		if (t == "string" || t == "number") {
			date = new Date(date);
		}
		
		var months = LITE_LABELS.MONTHS;
		
		if (today == date.getDate() && month == date.getMonth() && year == date.getFullYear()) {
			minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
			if (minutes < 1) {
				return LITE_LABELS.NOW;
			}
			else if (minutes < 2) {
				return LITE_LABELS.MINUTE_AGO;
			}
			else if (minutes < 60) {
				return (LITE_LABELS.MINUTES_AGO.replace("xMinutes", minutes));
			}
			else {
				hours = date.getHours();
				minutes = date.getMinutes();
				return LITE_LABELS.AT + " " + padNumber(hours, 2) + ":" + padNumber(minutes, 2, "0");
			}
		} 
		else if (year == date.getFullYear()) {
			return LITE_LABELS.ON + " " + LITE_LABELS_DATE(date.getDate(), date.getMonth());
		}
		else {
			return LITE_LABELS.ON + " " + LITE_LABELS_DATE(date.getDate(), date.getMonth(), date.getFullYear());
		}
	}
	
	function initModule() {
		if (_inited) {
			return;
		}
		_inited = true;
		var ckv = parseFloat(CKEDITOR.version);
		isOldCKEDITOR = isNaN(ckv) || ckv < 4.4;
	}
	
	/**
	 * returns true if the element matches one of the patterns
	 */
	function elementMatchesSelectors($el, patterns) {
		var i, len = patterns && patterns.length;
		if (! $el || ! len) {
			return false;
		}
		for (i = 0; i < len; ++i) {
			if ($el.is(patterns[i])) {
				return true;
			}
		}
		return false;
	}
	
	
	/**
	 * @class LITE.configuration
	 * The configuration object for the {@link LITE.lite} and the {@link LITE.LITEPlugin} objects
	 * This object is usually created in the CKEditor configuration file. It can also be created/modified
	 * in the callback for CKEditor's <strong>configLoaded</strong> event
	 * <p>In the config file, create this object with code such as:
	 * <pre>
	 * CKEDITOR.editorConfig = function( config ) {
	 * // ... your own configuration
	 *		var lite = config.lite = (config.lite || {});
	 * // now assign values to properties: lite.xxx = yyy;
	 * </pre>
	 * And here's an example for configuring lite in the <strong>configLoaded</strong> event:
	 * <pre>
	 * 		function onConfigLoaded(e) {
	 *  		var conf = e.editor.config;
	 *  		var lt = conf.lite = (conf.lite || {});
	 *  		lt.isTracking = false; 
	 *  	}
	 *  </pre>
	 */	

	
	/**
	 * @member LITE.configuration
	 * @property {Boolean} isTracking
	 */
	
	/**
	 * @member LITE.configuration
	 * @property {Object} debug
	 * set debug.log to true for LITE to print error messages in the browser console
	 */
	
	/**
	 * @member LITE.configuration
	 * @property {Array} includes
	 * sets the javascript include files to be included in LITE instead of the default. Use only for debugging or extending the plugin
	 */

	/**
	 * @member LITE.configuration
	 * @property {Object} userStyles
	 * A map of user id=>user style index
	 * Normally LITE will assign a style number for each user id it encounters in the markup. If you want to maintain consistent
	 * style per users (e.g. Melixon is always colored green, Thierry in chartreuse), assign a value to this property, e.g.
	 * <pre> 
	 * 	lite.userStyles = {
	 * 		15: 1,
	 * 		18:2,
	 * 		21:3
	 * 	};
	 * </pre>
	 */
	
	/**
	 * @member LITE.configuration
	 * @property {Object} tooltips
	 * Configures the tooltips shown by LITE
	 * <div><strong>Omit the classPath member in order to get tooltips in standard html title elements</strong></div>
	 * These are the default values used by LITE:
	 * <pre>
	 * 	lite.tooltips = {
	 * 		show: true, // set to false to prevent tooltips
	 * 		path: "js/opentip-adapter.js", // change to point to your own implementation
	 * 		classPath: "OpentipAdapter", // the full name of tooltip class construtor
	 * 		cssPath: "css/opentip.css", // the stylesheet file of the tooltips
	 * 		delay: 500 // the delay in milliseconds between hovering over a change node and the appearance of a tooltip
	 * 	};
	 * </pre>
	 * 
	 */
	
	/**
	 * @member LITE.configuration
	 * @property {String} jQueryPath
	 * the path (relative to the LITE plugin.js file) to jQuery
	 * @default js/jquery.min.js 
	 */

	/**
	 * @member LITE.configuration
	 * @property {String} tooltipTemplate
	 * A format string used to create the content of tooltips shown over change spans
	 * @default "%a by %u %t"
	 * <h3>formats</h3>
	 * (use uppercase to apply the format to the last modification date of the change span rather than the first) 
	 * <ul>
	 * <li><strong>%a</strong>  The action, "added" or "deleted" (not internationalized yet)
	 * <li><strong>%t</strong>  Timestamp of the first edit action in this change span (e.g. "now", "3 minutes ago", "August 15 1972")
	 * <li><strong>%u</strong>  the name of the user who made the change
	 * <li><strong>%dd</strong>  double digit date of change, e.g. 02
	 * <li><strong>%d</strong>  date of change, e.g. 2
	 * <li><strong>%mm</strong>  double digit month of change, e.g. 09
	 * <li><strong>%m</strong>  month of change, e.g. 9
	 * <li><strong>%yy</strong>    double digit year of change, e.g. 11
	 * <li><strong>%y</strong>    full month of change, e.g. 2011
	 * <li><strong>%nn</strong>    double digit minutes of change, e.g. 09
	 * <li><strong>%n</strong>    minutes of change, e.g. 9
	 * <li><strong>%hh</strong>    double digit hour of change, e.g. 05
	 * <li><strong>%h</strong>  hour of change, e.g. 5
	 * </ul>
	 * 
	 */
	
	/**
	 * @member LITE.configuration
	 * @property {String} jQueryPath
	 * the path (relative to the LITE plugin.js file) to jQuery
	 * @default js/jquery.min.js 
	 */

	/**
	 * @class LITE.lite
	 * The plugin object created by CKEditor. Since only one plugin is created per web page which may contain multiple instances of CKEditor, this object only handles
	 * the lifecycle of {@link LITE.LITEPlugin} the real plugin object.
	 * 
	 */
	CKEDITOR.plugins.add( 'lite',
	{
		
		icons: "lite-acceptall,lite-acceptone,lite-rejectall,lite-rejectone,lite-toggleshow,lite-toggletracking",// %REMOVE_LINE_CORE%
		hidpi: true,

		props : {
			deleteTag: 'del',
			insertTag: 'ins',
			deleteClass: 'ice-del',
			insertClass: 'ice-ins',
			attributes: {
					changeId: "data-cid",
					userId: "data-userid",
					userName: "data-username",
					sessionId: "data-session-id",
					changeData: "data-changedata",
					time: "data-time",
					lastTime: "data-last-change-time"
			},
			stylePrefix: 'ice-cts',
			preserveOnPaste: 'p',
			css: 'css/lite.css'
		},
		
		_scriptsLoaded : null, // not false, which means we're loading
		
		/**
		 * Called by CKEditor to init the plugin
		 * Creates an instance of a {@link LITE.LITEPlugin} if one is not already associated with the given editor. 
		 * @param ed an instance of CKEditor
		 */
		init: function(ed) {
			initModule();
			var rec = _findPluginRec(ed);
			if (rec) { // should not happen
				return;
			}

			var path = this.path,
				plugin = new LITEPlugin(this.props, path),
				liteConfig = CKEDITOR.tools.extend({}, ed.config.lite || {}),
				ttConfig = liteConfig.tooltips;
			
			if (undefined == ttConfig) {
				ttConfig = true;
			}
				
			if (ttConfig === true) {
				ttConfig = tooltipDefaults;
			}
			liteConfig.tooltips = ttConfig;
			
			addPlugin(ed, plugin);
			
			plugin.init(ed, liteConfig);
	
		
			ed.on("destroy", (function(editor) {
				var ind = _findPluginIndex(editor);
				if (ind >= 0) {
					_pluginMap.splice(ind, 1);
				}
			}).bind(this));
			
			if (this._scriptsLoaded) {
				plugin._onScriptsLoaded();
				return;
			}
			else if (this._scriptsLoaded === false) { // still loading, initial value was null
				return;
			}
			
			this._scriptsLoaded = false;
			var	jQueryLoaded = (typeof(jQuery) == "function"),
				self = this,
				jQueryPath = liteConfig.jQueryPath || "js/jquery.min.js",
				scripts = (liteConfig.includeType ? liteConfig["includes_" + liteConfig.includeType] : liteConfig.includes) || ["lite-includes.js"];
			
			scripts = scripts.slice(); // create a copy not referenced by the config
			
			for (var i = 0, len = scripts.length; i < len; ++i) {
				scripts[i] = path + scripts[i]; 
			}
			if (! jQueryLoaded) {
				scripts.splice(0, 0, this.path + jQueryPath);
			}
			if (ttConfig.path) {
				scripts.push(this.path + ttConfig.path);
			}
			
			var load1 = function() {
				if (scripts.length < 1) {
					self._scriptsLoaded = true;
					if (! jQueryLoaded) {
						jQuery.noConflict();
					}
					jQuery.each(_pluginMap, (function(i, rec) {
						rec.plugin._onScriptsLoaded();
					}));
				}
				else {
					var script = scripts.shift();
					CKEDITOR.scriptLoader.load(script, function() {load1();}, self);
				}
			};
			
			load1(scripts);		
		},
		
		/**
		 * returns the plugin instance associated with an editor
		 * @param editor
		 * @returns {Object} A LITE plugin instance
		 */
		findPlugin : function(editor) {
			return _findPlugin(editor);
		},
		
		/**
		 * starts a new session in the plugin instance associated with an editor
		 * @param editor
		 */
		startNewSession: function(editor) {
			var plugin = _findPlugin(editor);
			if (plugin) {
				plugin.startNewSession();
			}
			else {
				_logError("startNewSession: plugin not found");
			}
		}
		
	});
	
	/**
	 * @class LITE.LITEPlugin
	 * The LITEPlugin is created per instance of a CKEditor. This object handles all the events and commands associated with change tracking in a specific editor.
	 */
	var LITEPlugin = function(props, path) {
		this.props = CKEDITOR.tools.clone(props);
		this.path = path;
	};

	LITEPlugin.prototype = {
		/**
		 * Called by CKEditor to init the plugin
		 * @param ed an instance of CKEditor
		 * @param {LITE.configuration} config a LITE configuration object, not null, ready to be used as a local copy
		 */
		init: function(ed, config) {
			this._editor = ed;
			this._domLoaded =  false;
			this._editor =  null;
			this._tracker =  null;
			this._isVisible =  true; // changes are visible
			this._liteCommandNames =  [];
			this._canAcceptReject =  true; // enable state for accept reject overriding editor readonly
			this._removeBindings = [];

			ed.ui.addToolbarGroup('lite');
			this._setPluginFeatures(ed, this.props);
			this._changeTimeout = null;
			this._notifyChange = this._notifyChange.bind(this);
			this._notifyTextChange = this._notifyTextChange.bind(this);

			this._config = config;
			
			var allow = config.acceptRejectInReadOnly === true;
			var commandsMap = 	[	
				{
					command : LITE.Commands.TOGGLE_TRACKING,
					exec : this._onToggleTracking, 
					title: LITE_LABELS.TOGGLE_TRACKING,
//					icon: "track_changes_on_off.png",
					trackingOnly : false
				},
				{
					command: LITE.Commands.TOGGLE_SHOW, 
					exec: this._onToggleShow, 
					title: LITE_LABELS.TOGGLE_SHOW,
//					icon: "show_hide.png",
					readOnly : true
				},
				{
					command:LITE.Commands.ACCEPT_ALL, 
					exec:this._onAcceptAll, 
					title: LITE_LABELS.ACCEPT_ALL,
//					icon:"accept_all.png",
					readOnly : allow
				},
				{
					command:LITE.Commands.REJECT_ALL,
					exec: this._onRejectAll,
					title: LITE_LABELS.REJECT_ALL, 
//					icon:"reject_all.png",
					readOnly : allow
				},
				{
					command:LITE.Commands.ACCEPT_ONE,
					exec:this._onAcceptOne,
					title: LITE_LABELS.ACCEPT_ONE,
//					icon:"accept_one.png",
					readOnly : allow
				},
				{
					command:LITE.Commands.REJECT_ONE,
					exec:this._onRejectOne,
					title: LITE_LABELS.REJECT_ONE,
//					icon:"reject_one.png",
					readOnly : allow
				},
				{
					command:LITE.Commands.TOGGLE_TOOLTIPS,
					exec:this._onToggleTooltips,
					readOnly : true
				}
			];
		
			this._isTracking = config.isTracking !== false;
			this._eventsBounds = false;
		
			ed.on("contentDom", (function(dom) {
				this._onDomLoaded(dom);
			}).bind(this));
			ed.on("dataReady", (function(evt) {
				this._onAfterSetData(evt);
			}).bind(this));
			var path = this.path;
		
			var commands = config.commands || [LITE.Commands.TOGGLE_TRACKING, LITE.Commands.TOGGLE_SHOW, LITE.Commands.ACCEPT_ALL, LITE.Commands.REJECT_ALL, LITE.Commands.ACCEPT_ONE, LITE.Commands.REJECT_ONE];
		
			var self = this;
			
			function add1(rec) {
				ed.addCommand(rec.command, {
					exec : rec.exec.bind(self),
					readOnly: rec.readOnly || false
				});
		
				if (/*rec.icon && */rec.title && commands.indexOf(rec.command) >= 0) { // configuration doens't include this command
					var name = self._commandNameToUIName(rec.command);
					ed.ui.addButton(name, {
						label : rec.title,
						command : rec.command,
//						icon : path + "icons/" + rec.icon,
						toolbar: "lite"
					}); 
					if (rec.trackingOnly !== false) {
						self._liteCommandNames.push(rec.command);
					}
				}
			}
			
			
			for (var i = 0, len = commandsMap.length; i < len; ++i) {
				add1(commandsMap[i]);
			}
			

			if ( ed.addMenuItems ) {
				ed.addMenuGroup ( 'lite', 50);
				var params = {};
				params[LITE.Commands.ACCEPT_ONE] = {
					label : LITE_LABELS.ACCEPT_ONE,
					command : LITE.Commands.ACCEPT_ONE,
					group : 'lite',
					order : 1,
					icon : path + 'icons/accept_one.png'
				};
				params[LITE.Commands.REJECT_ONE] = {
					label : LITE_LABELS.REJECT_ONE,
					command : LITE.Commands.REJECT_ONE,
					group : 'lite',
					order : 2,
					icon : path + 'icons/reject_one.png'
				};

				ed.addMenuItems(params);
			}

			if ( ed.contextMenu ) {
				ed.contextMenu.addListener( (function( element /*, selection */ ) {
					 if (element && this._tracker && this._tracker.currentChangeNode(element)) {
						 var ret = {};
						 ret[LITE.Commands.ACCEPT_ONE] = CKEDITOR.TRISTATE_OFF;
						 ret[LITE.Commands.REJECT_ONE]= CKEDITOR.TRISTATE_OFF;
						 return ret;
					 }
					 else {
						 return null;
					 }
				}).bind(this) );
			}
		},
		
		/**
		 * Change the state of change tracking for the change editor associated with this plugin.
		 * Toggles tracking visibility in accordance with the tracking state. 
		 * @param {Boolean} track if undefined - toggle the state, otherwise set the tracking state to this value, 
		 * @param {Object} options an optional object with the following fields: <ul><li>notify: boolean, if not false, dispatch the TRACKING event
		 * <li>force: if true, don't check for pending changes and just toggle</ul>
		 */	
		toggleTracking: function(track, options) {
			if ("boolean" === typeof options) {
				options = {
						notify: options
				};
			}
			options = options || {};
			
			var tracking = (undefined === track) ? ! this._isTracking : track,
				e = this._editor,
				force = options && options.force;
			if (! tracking && this._isTracking && ! force) {
				var nChanges = this._tracker.countChanges({verify: true});
				if (nChanges) {
					return window.alert(LITE_LABELS.PENDING_CHANGES);
				}
			}
			this._isTracking = tracking;
			this._setCommandsState(this._liteCommandNames, tracking ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED);
			
			this._updateTrackingState();
			this.toggleShow(tracking, false);

			this._setCommandsState(LITE.Commands.TOGGLE_TRACKING, tracking ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF);
			var ui = e.ui.get(this._commandNameToUIName(LITE.Commands.TOGGLE_TRACKING));
			if (ui) {
				this._setButtonTitle(ui, tracking ? LITE_LABELS.STOP_TRACKING : LITE_LABELS.START_TRACKING);
			}
			if (options.notify !== false) {
				e.fire(LITE.Events.TRACKING, {tracking:tracking, lite:this});
			}
		},
		
		/**
		 * Change the visibility of tracked changes for the change editor associated with this plugin
		 * @param show if bool, set the visibility state to this value, otherwise toggle the state
		 * @param bNotify if not false, dispatch the TOGGLE_SHOW event
		 */	
		toggleShow : function(show, bNotify) {
			var vis = (typeof(show) == "undefined") ? (! this._isVisible) : show;
			this._isVisible = vis;
			if (this._isTracking) {
				this._setCommandsState(LITE.Commands.TOGGLE_SHOW, vis ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF);
			}
			this._tracker.setShowChanges(vis && this._isTracking);
			
			var ui = this._editor.ui.get(this._commandNameToUIName(LITE.Commands.TOGGLE_SHOW));
			if (ui) {
				this._setButtonTitle(ui, vis ? LITE_LABELS.HIDE_TRACKED : LITE_LABELS.SHOW_TRACKED);
			}
			if (bNotify !== false) {
				this._editor.fire(LITE.Events.SHOW_HIDE, {show:vis, lite:this});
			}
		},
		
		/**
		 * Are tracked changes visible?
		 * @returns {Boolean} true if tracked changes are visible
		 */
		isVisible : function() {
			return this._isVisible;
		},
		
		/**
		 * Are changes tracked?
		 * @returns {Boolean} true if changes are tracked
		 */
		isTracking: function() {
			return this._isTracking;
		},
		
		/**
		 * Accept all tracked changes
		 */
		acceptAll: function(options) {
			this._tracker.acceptAll(options);
			this._cleanup();
			this._editor.fire(LITE.Events.ACCEPT, {lite: this, options : options});
		},
		
		/**
		 * Reject all tracked changes
		 */
		rejectAll: function(options) {
			this._tracker.rejectAll(options);
			this._cleanup();
			this._editor.fire(LITE.Events.REJECT, {lite: this, options : options});
		},
		
		/**
		 * Set the name & id of the current user
		 * @param info an object with the fields name, id
		 */
		setUserInfo: function(info) {
			info = info || {};
			this._config.userId = String(info.id);
			this._config.userName = info.name || "";
			if (this._tracker) {
				this._tracker.setCurrentUser({ id: this._config.userId, name : this._config.userName });
			}
/*			if (this._editor) {
				var lite = this._editor.config.lite || {};
				this._editor.config.lite = lite;
			}; */
		},
		
		/**
		 * Return the count of pending changes
		 * @param options optional list of user ids whose changes we include or exclude (only one of the two should be provided,
		 * exclude has precdence).
		 */
		countChanges : function(options) {
			return ((this._tracker && this._tracker.countChanges(options)) || 0);		
		},
		
		/**
		 * Enable or disable the accept changes ui. This does not affect the availabibility of the accept/reject api
		 * @param bEnable
		 */
		enableAcceptReject : function(bEnable) {
			this._canAcceptReject  = !!bEnable;
			this._onIceChange();
		},
		
		/**
		 * For the CKEditor content filtering system, not operational yet
		 */
		filterIceElement : function( e ) {
			if (! e) {
				return true;
			}
			try {
				if (e.hasClass(this.props.insertClass) || e.hasClass(this.props.deleteClass)) {
					return false;
				}
			}
			catch (e) {
			}
			return true;
		},
		
		/**
		 * Create a new session. The change tracker unifies adjacent changes from the same user id, unless they are
		 * from different sessions
		 */
		startNewSession: function() {
			var now = new Date();
			this._sessionId = String.fromCharCode(65 + Math.round(Math.random() * 26)) + now.getDate() + now.getDay() + now.getHours() + now.getMinutes() + now.getMilliseconds();
			if (this._tracker) {
				this._tracker.setSessionId(this._sessionId);
			}
		},
		
		/**
		 * returns the provided html, or the html content of the editor, without change tracking markup and without deleted changes
		 * @param {String} text optional html to clean up 
		 * @returns {String}
		 */
		getCleanMarkup: function(text) {
			if (null === text || undefined === text) {
				text = (this._editor && this._editor.getData())  || "";
			}
			for (var i = _cleanRE.length - 1; i >= 0; --i) {
				text = text.replace(_cleanRE[i].regex, _cleanRE[i].replace);
			}
			return text;
		},
		
		/**
		 * Returns the text content of the editor, without deleted changes
		 * @returns
		 */
		getCleanText : function() {
			var root = this._getBody();
			if (! root){
				return "";
			}
			var textFragments = [];
			textFragments.push("");
			var deleteClass = this._tracker.getDeleteClass();
			this._getCleanText(root, textFragments, deleteClass);
			var str = textFragments.join("\n");
			str = str.replace(/&nbsp(;)?/ig, ' ');
			return str;
		},
		
		/**
		 * Accept the change associated with a DOM node
		 * @param node either a DOM node or a CKEditor DOM node
		 */
		acceptChange: function(node) {
			node = nodeToDOMNode(node);
			if (node && this._tracker) {
				this._tracker.acceptChange(node);
				this._cleanup();
				this._editor.fire(LITE.Events.ACCEPT, {lite:this});
				this._onSelectionChanged(null);
			}
		},
		
		/**
		 * Reject the change associated with a DOM node
		 * @param node either a DOM node or a CKEditor DOM node
		 */
		rejectChange: function(node) {
			node = nodeToDOMNode(node);
			if (node && this._tracker) {
				this._tracker.rejectChange(node);
				this._cleanup();
				this._editor.fire(LITE.Events.REJECT, {lite:this});
				this._onSelectionChanged(null);
			}
		},
		
		////////////// Implementation ///////////////

		_getCleanText : function(e, textFragments, deleteClass) { // assumed never to be called with a text node
			var cls = e.getAttribute("class");
			if (cls && cls.indexOf(deleteClass) >= 0) {
				return;
			}
			
			var isBlock;
			if (isBlock = ((e.nodeName && e.nodeName.toUpperCase() == "BR") || ("block" == jQuery(e).css("display")))) {
				if (_emptyRegex.test(textFragments[textFragments.length - 1])) {
					textFragments[textFragments.length - 1] = "";
				}
				else {
					textFragments.push("");
				}
			}
			for (var child = e.firstChild; child; child = child.nextSibling) {
				var nodeType = child.nodeType;
				if (3 == nodeType) {
					textFragments[textFragments.length - 1] += String(child.nodeValue);
				}
				else if (1 == nodeType || 9 == nodeType || 11 == nodeType) {
					this._getCleanText(child, textFragments, deleteClass);
				}
			}
			if (isBlock) {
				textFragments.push("");
			}
		},
		
		_onDomLoaded : function(dom) {
			this._domLoaded = true;
			this._editor = dom.editor;
			var ed = this._editor.editable();
			ed.attachListener(ed, "mousedown", this._onMouseDown, this, null, 1);
			ed.attachListener(ed, "keypress", this._onKeyPress, this, null, 1);
//TEMP
			this._hideTooltip(); // clean up any leftover tooltip elements
			this._onReady();
		},
		
		_onScriptsLoaded : function(/*completed, failed */) {
			this._scriptsLoaded = true;
			this._onReady();
		},
		
		_loadCSS : function(doc, cssPath) {
			var head = doc.getElementsByTagName("head")[0];
			function load(path, id) {
				var style = jQuery(head).find('#' + id);
				if (! style.length) {
					style = doc.createElement("link");
					style.setAttribute("rel", "stylesheet");
					style.setAttribute("type", "text/css");
					style.setAttribute("id", id);
					style.setAttribute("href", path);
					head.appendChild(style);
				}
			}
			load(this.path + cssPath, "__lite__css__");
			
			if (this._config.tooltips.cssPath) {
				load(this.path + this._config.tooltips.cssPath, "__lite_tt_css__");
			}
		},
		
		_onReady : function() {
			if (! this._scriptsLoaded || ! this._domLoaded) {
				return;
			}
			// leave some time for initing, seems to help...
			setTimeout(this._afterReady.bind(this), 5);
		},
		
		_getBody : function() {
			try {
				return this._editor.editable().$;
			}
			catch (e) {
				return null;
			}
		},
		
		_afterReady : function() {
			var e = this._editor,
				doc = e.document.$,
				body = this._getBody(),
				config = this._config,
				debug = (config && config.debug) || {};
			
			this._loadCSS(doc, (config && config.cssPath) || "css/lite.css");
			
			if (! this._eventsBounds) {
				this._eventsBounds = true;
				var paste = this._onPaste.bind(this);
				e.on("afterCommandExec", this._onAfterCommand.bind(this));
				e.on("beforeCommandExec", this._onBeforeCommand.bind(this));
				if (this._config.handlePaste) {
					e.on("paste", paste, null, null, 1);
				}
				e.on("beforeGetData", this._onBeforeGetData.bind(this));
				e.on("beoreUndoImage", this._onBeforeGetData.bind(this)); // treat before undo as before getdata
				e.on("insertHtml", paste, null, null, 1);
				e.on("insertText", paste, null, null, 1);
				e.on("insertElement", paste, null, null, 1);
				e.on("mode", this._onModeChange.bind(this), null, null, 1);
				e.on("readOnly", this._onReadOnly.bind(this));
			}
			
			if (this._tracker) {
				if (body != this._tracker.getContentElement()) {
					this._tracker.stopTracking(true);
					jQuery(this._tracker).unbind();
					this._tracker = null;
				}
			}
		
			if (this._tracker) {
				return;
			}
			var iceprops = {
				element: body,
				mergeBlocks : false,
				currentUser: {
					id: config.userId || "",
					name: config.userName || ""
				},
				userStyles: config.userStyles,
				changeTypes: {
					insertType: {tag: this.props.insertTag, alias: this.props.insertClass, action:"Inserted"},
					deleteType: {tag: this.props.deleteTag, alias: this.props.deleteClass, action:"Deleted"}
				},
				hostMethods: {
					getHostRange : this._getHostRange.bind(this),
					getHostRangeData: this._getHostRangeData.bind(this),
					makeHostElement: function(node) {
						return new CKEDITOR.dom.element(node);
					},
					getHostNode: function(node) {
						return node && node.$;
					},
					setHostRange: this._setHostRange.bind(this),
					hostCopy: this._hostCopy.bind(this),
					beforeEdit: this._beforeEdit.bind(this),
					notifyChange: this._afterEdit.bind(this)
				}
			};
			if (debug.log) {
				iceprops.hostMethods.logError = _logError;
			}

			iceprops.tooltips = config.tooltips.show;
			if (iceprops.tooltips) {
				var hideTT = this._hideTooltip.bind(this);
				iceprops.hostMethods.showTooltip = this._showTooltip.bind(this);
				iceprops.hostMethods.hideTooltip = hideTT;
				iceprops.hostMethods.beforeDelete = iceprops.hostMethods.beforeInsert = hideTT;
				if (config.tooltips.classPath) {
					try {
						this._tooltipsHandler = new window[config.tooltips.classPath]();
						iceprops.tooltipsDelay = config.tooltips.delay;
					}
					catch (e){}
					if (! this._tooltipsHandler) {
						_logError("Unable to create tooltip handler", config.tooltips.classPath);
					}
					else {
						this._tooltipsHandler.init(config.tooltips);
					}
				}
			}
			jQuery.extend(iceprops, this.props);
			this._tracker = new ice.InlineChangeEditor(iceprops);
			try {
				this._tracker.startTracking();
				this.toggleTracking(this._isTracking, false);
				this._updateTrackingState();
				jQuery(this._tracker).on("change", this._onIceChange.bind(this)).on("textChange", this._onIceTextChanged.bind(this));
				e.fire(LITE.Events.INIT, {lite: this});
				this._onSelectionChanged(null);
				this._onIceChange(null);
			}
			catch(e) {
				_logError("ICE plugin init:", e);
			}
		},
		
		_onToggleShow : function(/*event */) {
			this.toggleShow();
		},
		
		_onToggleTracking : function(/*event */) {
			this.toggleTracking();
		},
		
		_onRejectAll : function(/*event */)  {
			this.rejectAll();
		},
		
		_onAcceptAll : function(/*event */) {
			this.acceptAll();
		},
		
		_onAcceptOne : function(/*event */) {
			var node = this._tracker.currentChangeNode();
			return this.acceptChange(node);
		},
		
		_onRejectOne : function(/*event */) {
			var node = this._tracker.currentChangeNode();
			return this.rejectChange(node);
		},
		
		_onToggleTooltips: function(/*event */) {
			this._tracker && this._tracker.toggleTooltips();
		},
		
		/**
		 * Clean up empty ICE elements
		 * @private
		 */
		_cleanup : function() {
			var body = this._getBody(),
				empty = jQuery(body).find(self.insertSelector + ':empty,' + self.deleteSelector + ':empty');
			empty.remove();
			this._onSelectionChanged(null);
		},
		
		/**
		 * Sets the title of a button
		 * @private
		 * @param button
		 * @param title
		 */
		_setButtonTitle : function(button, title) {
			var e = jQuery('#' + button._.id);
			e.attr('title', title);
		},
		
		/**
		 * Called after the execution of a CKEDITOR command
		 * @private
		 * @param event
		 */
		_onAfterCommand: function(event) {
			var name = this._tracker && this._isTracking && event.data && event.data.name;
			if ("undo" == name || "redo" == name) {
				this._tracker.reload();
			}
		},
		
		_onBeforeCommand: function(event) {
			var name = this._tracker && this._tracker.isTracking() && event.data && event.data.name;
			if ("cut" == name) {
				if (testClipboardCommand(this._editor, "copy")) {
					this._tracker.prepareToCut();
				}
			}
			else if ("copy" == name) {
				if (testClipboardCommand(this._editor, "copy")) {
					this._tracker.prepareToCopy();
				}
			}
		},
		
		/**
		 * Called after the mode of the editor (wysiwyg/source) changes
		 * @private
		 * @param ignore The event
		 */
		_onModeChange: function(ignore){
			this._updateTrackingState();
			setTimeout(this._onIceChange.bind(this), 0);
		},
		
		_onKeyPress: function(evt) {
			var code = evt && evt.data && evt.data.getKeystroke();
			if (isCutKeystroke(code)) {
				evt.stop();
			}
		},
		
		_onKeyDown: function(evt) {
			if (! this._tracker || ! this._tracker.isTracking()) {
				return;
			}
			
			var code = evt.data.keyCode;
/*
 * 				case CKEDITOR.CTRL + 86: // CTRL+V
				case CKEDITOR.SHIFT + 45: // SHIFT+INS
 */			
			if (isCutKeystroke(code)) {
				if (this._tracker.tryToCut()) {
					evt.stop();
				}
			} 
		},

		_onMouseDown: function(/*evt*/) {
			this._hideTooltip();
		},
		
		/**
		 * Callback for the editor's beforeGetData event
		 * Remove tooltips from dom
		 */
		_onBeforeGetData: function(/*evt*/) {
			this._hideTooltip();
		},
		
		/**
		 * Callback for the editor's afterSetData event
		 * Remove tooltips from dom
		 */
		_onAfterSetData: function(/*evt*/) {
			this._hideTooltip();
			this._processContent();
			if (this._tracker/* && this._tracker.isTracking() */) {
				this._tracker.reload();
			}
		},
		
		/**
		 * Called after the readonly state of the editor changes
		 * @private
		 */
		_onReadOnly: function(/*evt*/){
			this._updateTrackingState();			
		},
		
		/**
		 * Recalculates the tracking state according to the tracking flag, editor mode and editor readonly
		 * @private
		 */
		_updateTrackingState: function() {
			if (this._tracker) {
				var track = this._isTracking && this._editor.mode == "wysiwyg" && ! this._editor.readOnly;
				this._tracker.toggleChangeTracking(track);
				for (var i = this._removeBindings.length - 1; i >= 0; --i) {
					this._removeBindings[i].removeListener();
				}
				this._removeBindings = [];
				this._tracker.unlistenToEvents();
				if (track) {
					var handler = this._onSelectionChanged.bind(this),
						editable = this._editor.editable();
					if (isOldCKEDITOR) {
						this._tracker.listenToEvents();
					}
					else {
						this._removeBindings.push(this._editor.on("key", function(e) {
							if (this._tracker) {
								var event = e.data.domEvent && e.data.domEvent.$;
								// onkeydown returns true to prevent, so return false it it returns true
								return event ? this._tracker.handleEvent(event) : true;
							}
							return true;
						}.bind(this)));
					}
					this._removeBindings.push(editable.on("keyup", this._onSelectionChanged.bind(this, null, false)));
					this._removeBindings.push(editable.on("click", handler));
					this._removeBindings.push(this._editor.on("selectionChange", handler));
				}
			}
		},

		/**
		 * Paste the content of the clipboard through ICE
		 * @private
		 */
		_onPaste : function(evt){
			if (! this._tracker || ! this._isTracking || ! evt) {
				return true;
			}
			var data = //"<ins><div>man</div><p><del><div><ins>who is this guy</ins><del>this is deleted</del></div><div><del><span>text1</span><ins><div>calling all nature</div><del>inner del</del></ins></del></div><span>going again</span><h2>the thing</h2></del></p></ins>",
				evt.data || {},
				ignore = false,
				toInsert = null,
				selectors = this._config.ignoreSelectors || [],
				$ = window.jQuery,
				node = (evt.name == "insertElement") && data.$;
			if (! data) {
				return;
			}
			if ("string" == typeof data) {
				data = {
					dataValue: data,
					type: "text"
				}
			}
			if (node) {
				ignore = node.getAttribute("data-track-changes-ignore");
			}
			else if (data.dataValue && "html" == (data.type || data.mode)) {
				try {
					node = jQuery(data.dataValue);
					ignore = node && node.attr("data-track-changes-ignore");
				}
				catch (e) {}
			}
			
			if (ignore) {
				return true;
			}
			if ("string" == typeof data.dataValue) {
				try {
					var doc = this._editor.document.$,
						container = doc.createElement("div");
					container.innerHTML = String(data.dataValue);
					container = this._tracker.getCleanDOM(container);
					if (! container.innerHTML) {
						return true;
					}
					toInsert = jQuery.makeArray(container.childNodes);
				}
				catch (e) {
					_logError("ice plugin paste:", e);
				}
			}
			else if (node) {
				toInsert = [node];
			}
			else {
				return true;
			}
			if (toInsert && selectors.length) {
				toInsert = toInsert.filter(function(e) {
					return ! elementMatchesSelectors($(e), selectors);
				});
			}
			if (toInsert && toInsert.length) {
				toInsert = cleanClipboard(toInsert);
				var focused = this._editor.focusManager.hasFocus;
				this._beforeInsert();
				this._tracker.insert({nodes: toInsert});
				this._afterInsert();
				if (focused) {
					this._editor.editable().focus();
				}
				evt.stop();
				this._onIceTextChanged();
			}

			return true;
		},
		
		/**
		 * Set the state of multiple commands
		 * @param commands An array of command names or a comma separated string
		 * @param state CKEDITOR command state
		 * @private
		 */
		_setCommandsState: function(commands, state) {
			if (typeof(commands) == "string") {
				commands = commands.split(",");
			}
			for (var i = commands.length - 1; i >= 0; --i) {
				var cmd = this._editor.getCommand(commands[i]);
				if (cmd) {
					cmd.setState(state);
				}
			}
		},
		
		/**
		 * Handler for selection change events (caret moved or text marked/unmarked)
		 * @param event
		 * @param cleanupDOM flag passed to the tracker's isInsideChange method. Must be false to avoid cleaning up dom
		 * @private
		 */
		_onSelectionChanged : function(event, cleanupDOM) {
			var inChange = this._isTracking && this._tracker && this._tracker.isInsideChange(null, null, cleanupDOM),
				state = inChange && this._canAcceptReject ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED;
			this._setCommandsState([LITE.Commands.ACCEPT_ONE, LITE.Commands.REJECT_ONE], state);
		},
		
		/**
		 * called when ice fires a change event
		 * @param e jquery event
		 * @private
		 */
		_onIceChange : function(e) {
			var hasChanges = this._isTracking && this._tracker && this._tracker.hasChanges();
			var state = hasChanges && this._canAcceptReject ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED;
			this._setCommandsState([LITE.Commands.ACCEPT_ALL, LITE.Commands.REJECT_ALL], state);
			this._onSelectionChanged();
			if (e) { //otherwise it's just a ui update
				this._triggerChange();
			}
		},
		
		/**
		 * @ignore
		 * @param ignore event
		 */
		_onIceTextChanged : function(ignore) {
			this._triggerChange();
		},
		
		/**
		 * @ignore
		 */
		_triggerChange : function() {
			if (! this._changeTimeout) {
				this._changeTimeout = setTimeout(this._notifyChange, 1);
			}
		},
		
		/**
		 * @ignore
		 */
		_notifyChange : function() {
			this._changeTimeout = null;
			this._editor.fire(LITE.Events.CHANGE, {lite:this});
		},

		/**
		 * @ignore
		 */
		_notifyTextChange : function() {
			this._changeTimeout = null;
			this._editor.fire('change',{lite:this});
		},
		
		/**
		 * @ignore
		 */
		_processContent: function() {
			var body = this._getBody(),
				$ = window.jQuery,
				insTag = this.props.insertTag,
				delTag = this.props.deleteTag,
				nodes, doc;
			if (! body) {
				return;
			}
			doc = body.ownerDocument;
			function replaceNode(node, tag) {
				var parent = node.parentNode,
					newNode = doc.createElement(tag);
				$.each( node.attributes, function( index, attr ) {
	                newNode.setAttribute(attr.name, attr.value);
	            });
				newNode.className = node.className || "";
				$(node).contents().appendTo(newNode);
				parent.insertBefore(newNode, node);
				parent.removeChild(node);
			}
			
			if (insTag !== "span") {
				nodes = $(body).find("span." + this.props.insertClass);
				nodes.each(function(i, node) {
					replaceNode(node, insTag);
				});
			}
			if (delTag !== "span") {
				nodes = $(body).find("span." + this.props.deleteClass);
				nodes.each(function(i, node) {
					replaceNode(node, delTag);
				});
			}
		},
		
		/**
		 * @ignore
		 * @param command
		 * @returns
		 */
		_commandNameToUIName : function(command) {
			return command.replace(".", "_");
		},
		
		/**
		 * @ignore
		 * @param editor
		 * @param props
		 */
		_setPluginFeatures : function(editor, props) {
			function makeClasses() {
				return [props.deleteClass,props.insertClass,props.stylePrefix+'*'];
			}
			
			function makeAttributes() {
				var attrs = ['title'];
				for (var key in props.attributes) {
					if (props.attributes.hasOwnProperty(key)) {
						var value = props.attributes[key];
						if ((typeof value === "string") && value.indexOf("data-") === 0) {
							attrs.push(value);
						}
					}
				}
				return attrs;
			}
			
			function makeFeature(arr) {
				var ret = {};
				arr.forEach(function(member) {
					ret[member] = true;
				});
				return ret;
			}

			if (! editor || ! editor.filter || ! editor.filter.addFeature) {
				return;
			}
			
			try {	
				var features = [], feature, fields;
				
				feature = {};
				fields = {};
				fields.classes = makeFeature(makeClasses());
				fields.attributes = makeFeature(makeAttributes());
				feature[props.insertTag] = fields;
				feature[props.deleteTag] = CKEDITOR.tools.clone(fields);

				feature['br'] = CKEDITOR.tools.clone(fields);
				feature['br'].propertiesOnly = true;

				// prepare to clean up legacy data
				feature.span = CKEDITOR.tools.clone(fields);

				editor.filter.addFeature({
					name: "lite-features",
					allowedContent: feature
				});				
			}
			catch (e){
				_logError(e);
			}
		},
		
		/**
		 * @ignore
		 * @param range
		 */
		_setHostRange: function(range) {
			var selection = this._editor && this._editor.getSelection();
			if (selection) {
				selection.selectRanges([range]);
			}
		},
		
		_afterEdit: function() {
			this._editor.fire('change');
			this._editor.fire('saveSnapshot');
		},
		
		_beforeEdit: function() {
			CKEDITOR.iscutting = true;
			var e = this._editor,
				f = function() {
					e.fire('saveSnapshot');
				};
			f();// Save before cut
			setTimeout(function() {
				CKEDITOR.iscutting = false;
			}, 100);
//			setTimeout(f, 30);
		},
		
		_hostCopy: function() {
			try {
				if ( CKEDITOR.env.ie ) {
					testIECommand(this._editor, "copy" ); 
				}
				else {
					// Other browsers throw an error if the command is disabled.
					this._editor.document.$.execCommand( "copy", false, null );
				} 
			}
			catch ( e ) {
				_logError(e);
			}
		},

		/**
		 * @ignore
		 * @returns {Boolean}
		 */
		_getHostRange: function() {
			var selection = this._editor && this._editor.getSelection(),
				ranges = selection && selection.getRanges(),
				range = ranges && ranges[0];
			return range || null;
		},
		
		_getHostRangeData: function(hostRange) {
			hostRange = hostRange || this._getHostRange();
			if (! hostRange) {
				return null;
			}
			return {
				startContainer: hostRange.startContainer && hostRange.startContainer.$,
				endContainer: hostRange.endContainer && hostRange.endContainer.$,
				startOffset: hostRange.startOffset,
				endOffset: hostRange.endOffset
			};
		},
		
		/**
		 * @ignore
		 * @param node
		 * @param change
		 */
		_showTooltip: function(node, change) {
			var config = this._config.tooltips;
			if (config.events) {
				return this._editor && this._editor.fire(LITE.Events.HOVER_IN, {
					lite:this,
					node: node,
					changeId: change.changeId});
			}
			if (config.show) {
				var title = this._makeTooltipTitle(change);
				if (this._tooltipsHandler) {
					this._tooltipsHandler.hideAll(this._getBody());
					this._tooltipsHandler.showTooltip(node, title, this._editor.container.$);
				}
				else {
					node.setAttribute("title", title);
				}
			}
		},
		
		/**
		 * @ignore
		 * @param node
		 */
		_hideTooltip: function(node) {
			var config = this._config.tooltips;
			if (config.events) {
				return this._editor && this._editor.fire(LITE.Events.HOVER_OUT, {
					lite:this,
					node: node
				});
			}
			if (this._tooltipsHandler) {
				if (node) {
					this._tooltipsHandler.hideTooltip(node);
				}
				else {
					this._tooltipsHandler.hideAll(this._getBody());
				}
			}
			else {
				if (this._tracker) {
					if (node) {
						node.removeAttribute("title");
					}
					else {
						var nodes = this._tracker.getIceNodes();
						if (nodes) {
							nodes.removeAttr("title");
						}
					}
				}
			}
		},
		
		/**
		 * Copied from ckeditor
		 * @ignore
		 */
		_beforeInsert: function() {
			this._editor.fire( 'saveSnapshot' );
		},

		/**
		 * Copied from ckeditor
		 * @ignore
		 */
		_afterInsert: function( ) {
			var editor = this._editor;

			editor.getSelection().scrollIntoView();
/*			setTimeout( function() {
				editor.fire( 'saveSnapshot' );
			}, 0 ); */
		},
		
/**
 * @ignore
 * @param change
 * @returns {Boolean}
 */		_makeTooltipTitle: function(change) {
			var title = this._config.tooltipTemplate || defaultTooltipTemplate,
				time = new Date(change.time),
				lastTime = new Date(change.lastTime);
			title = title.replace(/%a/g, "insert" == change.type ? LITE_LABELS.CHANGE_TYPE_ADDED : LITE_LABELS.CHANGE_TYPE_DELETED);
			title = title.replace(/%t/g, relativeDateFormat(time));
			title = title.replace(/%u/g, change.userName);
			title = title.replace(/%dd/g, padNumber(time.getDate(), 2));
			title = title.replace(/%d/g, time.getDate());
			title = title.replace(/%mm/g, padNumber(time.getMonth() + 1, 2));
			title = title.replace(/%m/g, time.getMonth() + 1);
			title = title.replace(/%yy/g, padNumber(time.getYear() - 100, 2));
			title = title.replace(/%y/g, time.getFullYear());
			title = title.replace(/%nn/g, padNumber(time.getMinutes(), 2));
			title = title.replace(/%n/g, time.getMinutes());
			title = title.replace(/%hh/g, padNumber(time.getHours(), 2));
			title = title.replace(/%h/g, time.getHours());

			title = title.replace(/%T/g, relativeDateFormat(lastTime));
			title = title.replace(/%DD/g, padNumber(lastTime.getDate(), 2));
			title = title.replace(/%D/g, lastTime.getDate());
			title = title.replace(/%MM/g, padNumber(lastTime.getMonth() + 1, 2));
			title = title.replace(/%M/g, lastTime.getMonth() + 1);
			title = title.replace(/%YY/g, padNumber(lastTime.getYear() - 100, 2));
			title = title.replace(/%Y/g, lastTime.getFullYear());
			title = title.replace(/%NN/g, padNumber(lastTime.getMinutes(), 2));
			title = title.replace(/%N/g, lastTime.getMinutes());
			title = title.replace(/%HH/g, padNumber(lastTime.getHours(), 2));
			title = title.replace(/%H/g, lastTime.getHours());

			return title;
		}
		

		
	};
	
	/**
	 * @ignore
	 */
	function _logError() {
		var console = window.console;
		if (console && console.error) {
			console.error.apply(console, [].slice.call(arguments));
		}
	}
	
	function testClipboardCommand(editor, command) {
		if ( CKEDITOR.env.ie ) {
			return testIECommand(editor, command);
		}

		// non-IEs part
		try {
			// Other browsers throw an error if the command is disabled.
			return editor.document.$.execCommand( command, false, null );
		} 
		catch ( e ) {
			return false;
		}
	}

	/**
	 * Tries to execute any of the paste, cut or copy commands in IE. Returns a
	 * boolean indicating that the operation succeeded.
	 * Copied from ckeditor
	 * @param editor instance of CKEditor
	 * @param {String} command *LOWER CASED* name of command ('paste', 'cut', 'copy').
	 * */
	function testIECommand( editor, command ) {
		var doc = editor.document,
			body = doc.getBody(),
			enabled = false,
			success,
			onExec = function() {
				enabled = true;
			};

		// The following seems to be the only reliable way to detect that
		// clipboard commands are enabled in IE. It will fire the
		// onpaste/oncut/oncopy events only if the security settings allowed
		// the command to execute.
		body.on( command, onExec );

		// IE7: document.execCommand has problem to paste into positioned element.
		success = ( CKEDITOR.env.version > 7 ? doc.$ : doc.$.selection.createRange() )[ 'execCommand' ]( command, false );

		body.removeListener( command, onExec );

		return success || enabled;
	}

})(window.CKEDITOR);
