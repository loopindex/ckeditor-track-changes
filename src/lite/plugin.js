/**
Copyright 2013 LoopIndex, This file is part of the Track Changes plugin for CKEditor.

The track changes plugin is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License, version 2, as published by the Free Software Foundation.
This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU Lesser General Public License along with this program as the file lgpl.txt. If not, see http://www.gnu.org/licenses/lgpl.html.

Written by (David *)Frenkiel - https://github.com/imdfl
**/

(function() {

	var LITE = {
		Events : {
			INIT : "lite:init",
			ACCEPT : "lite:accept",
			REJECT : "lite:reject",
			SHOW_HIDE : "lite:showHide",
			TRACKING : "lite:tracking"
		},
		
		Commands : {
			TOGGLE_TRACKING : "lite.ToggleTracking",
			TOGGLE_SHOW : "lite.ToggleShow",
			ACCEPT_ALL : "lite.AcceptAll",
			REJECT_ALL : "lite.RejectAll",
			ACCEPT_ONE : "lite.AcceptOne",
			REJECT_ONE : "lite.RejectOne"
		}
	};
	
	var _emptyRegex = /^[\s\r\n]*$/; // for getting the clean text
	var _pluginMap = [];
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
	CKEDITOR.plugins.add( 'lite',
	{

	props : {
		deleteTag: 'span',
		insertTag: 'span',
		deleteClass: 'ice-del',
		insertClass: 'ice-ins',
		changeIdAttribute: 'data-cid',
		userIdAttribute: 'data-userid',
		userNameAttribute: 'data-username',
		changeDataAttribute: 'data-changedata',
		stylePrefix: 'ice-cts',
		timeAttribute: 'data-time',
		preserveOnPaste: 'p',
		css: 'css/lite.css',
		titleTemplate : "Changed by %u %t"
	},
	
	_scriptsLoaded : null, // not false, which means we're loading
	
	/**
	 * Called by CKEditor to init the plugin
	 * @param ed an instance of CKEditor
	 */
	init: function(ed) {
		var rec = _findPluginRec(ed);
		if (rec) { // should not happen
			return;
		}
		// (CKEDITOR.ELEMENT_MODE_INLINE == ed.elementMode) {
		if (! this._inited) { 
			_ieFix();
			this._inited = true;
		}
		var path = this.path;
		var plugin = new LITEPlugin(this.props, path);
		addPlugin(ed, plugin);
		plugin.init(ed);

		var liteConfig = ed.config.lite || {};
		
	
		ed.on("destroy", (function(editor) {
			var ind = _findPluginIndex(editor.editor);
			if (ind >= 0) {
				if (_pluginMap[ind].plugin._tracker) {
						_pluginMap[ind].plugin._tracker.stopTracking(true);
						jQuery(_pluginMap[ind].plugin._tracker).unbind();
						_pluginMap[ind].plugin._tracker = null;

				}
				_pluginMap.splice(ind, 1);
			}
		}).bind(this));
		
	
		
		if (this._scriptsLoaded == true) {
			plugin._onScriptsLoaded();
			return;
		}
		else if (this._scriptsLoaded === false) {
			return;
		}
		
		this._scriptsLoaded = false;
		var self = this,
			jQueryPath = liteConfig.jQueryPath || "js/jquery.min.js",
			scripts = liteConfig.includes || ["js/rangy/rangy-core.js", "js/ice.js", "js/dom.js", "js/selection.js", "js/bookmark.js",
											  "js/icePluginManager.js", "js/icePlugin.js", "lite_interface.js"];
		
		for (var i = 0, len = scripts.length; i < len; ++i) {
			scripts[i] = path + scripts[i]; 
		}
		if (typeof(jQuery) == "undefined") {
			scripts.splice(0, 0, this.path + jQueryPath);
		}
		
		var load1 = function() {
			if (scripts.length < 1) {
				self._scriptsLoaded = true;
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
	}
	
});
	
	LITEPlugin = function(props, path) {
		this.props = {};
		this.path = path;
		for (var key in props) {
			if (props.hasOwnProperty(key)) {
				this.props[key] = props[key];
			}
		}
	}

	LITEPlugin.prototype = {
		/**
		 * Called by CKEditor to init the plugin
		 * @param ed an instance of CKEditor
		 */
		init: function(ed) {
			this._editor = ed;
			this._domLoaded =  false;
			this._editor =  null;
			this._tracker =  null;
			this._isVisible =  true; // changes are visible
			this._liteCommandNames =  [];
			this._canAcceptReject =  true; // enable state for accept reject overriding editor readonly

			ed.ui.addToolbarGroup('lite');
			this._setPluginFeatures(ed, this.props);
			this._changeTimeout = null;
			this._boundNotifyChange = this._notifyChange.bind(this);

			var liteConfig = ed.config.lite || {};
			
			var allow = liteConfig.acceptRejectInReadOnly === true;
			var commandsMap = 	[	
				{ command : LITE.Commands.TOGGLE_TRACKING,
					exec : this._onToggleTracking, 
					title: "Toggle Tracking Changes",
					icon: "track_changes_on_off.png",
					trackingOnly : false
				},
				{
					command: LITE.Commands.TOGGLE_SHOW, 
					exec: this._onToggleShow, 
					title: "Toggle Tracking Changes",
					icon: "show_hide.png",
					readOnly : true
				},
				{
					command:LITE.Commands.ACCEPT_ALL, 
					exec:this._onAcceptAll, 
					title:"Accept all changes",
					icon:"accept_all.png",
					readOnly : allow
				},
				{
					command:LITE.Commands.REJECT_ALL,
					exec: this._onRejectAll,
					title: "Reject all changes", 
					icon:"reject_all.png",
					readOnly : allow
				},
				{
					command:LITE.Commands.ACCEPT_ONE,
					exec:this._onAcceptOne,
					title:"Accept Change",
					icon:"accept_one.png",
					readOnly : allow
				},
				{
					command:LITE.Commands.REJECT_ONE,
					exec:this._onRejectOne,
					title:"Reject Change",
					icon:"reject_one.png",
					readOnly : allow
				}
			];
		
			this._isTracking = liteConfig.isTracking !== false;
			this._eventsBounds = false;
		
			ed.on("contentDom", (function(dom) {
				this._onDomLoaded(dom);
			}).bind(this));
			var path = this.path;
		
			var commands = liteConfig.commands || [LITE.Commands.TOGGLE_TRACKING, LITE.Commands.TOGGLE_SHOW, LITE.Commands.ACCEPT_ALL, LITE.Commands.REJECT_ALL, LITE.Commands.ACCEPT_ONE, LITE.Commands.REJECT_ONE];
		
			var self = this;
			
			function add1(rec) {
				ed.addCommand(rec.command, {
					exec : rec.exec.bind(self),
					readOnly: rec.readOnly || false
				});
		
				if (commands.indexOf(rec.command) >= 0) { // configuration doens't include this command
					var name = self._commandNameToUIName(rec.command);
					ed.ui.addButton(name, {
						label : rec.title,
						command : rec.command,
						icon : path + "icons/" + rec.icon,
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
					label : 'Accept Change',
					command : LITE.Commands.ACCEPT_ONE,
					group : 'lite',
					order : 1,
					icon : path + 'icons/accept_one.png'
				};
				params[LITE.Commands.REJECT_ONE] = {
					label : 'Reject Change',
					command : LITE.Commands.REJECT_ONE,
					group : 'lite',
					order : 2,
					icon : path + 'icons/reject_one.png'
				};

				ed.addMenuItems(params);
			}

			if ( ed.contextMenu ) {
				ed.contextMenu.addListener( (function( element, selection ) {
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
		 * Change the state of change tracking for the change editor associated with this plugin
		 * @param track if bool, set the tracking state to this value, otherwise toggle the state
		 * @param bNotify if not false, dispatch the TRACKING event
		 */	
		toggleTracking: function(track, bNotify) {
			//console.log("plugin.toggleTracking", !!track);
			var tracking = (typeof(track) == "undefined") ? (! this._isTracking) : track;
			this._isTracking = tracking;
		
			for (var i = this._liteCommandNames.length - 1; i >= 0; --i) {
				var cmd = this._editor.getCommand(this._liteCommandNames[i]);
				if (cmd) {
					if (tracking) {
						cmd.enable();
					}
					else {
						cmd.disable();
					}
				}
			}
			
			if (tracking) {
				this._tracker.enableChangeTracking();
				this.toggleShow(true);
			}
			else {
				this._tracker.disableChangeTracking();
				this.toggleShow(false);
			}
			var ui = this._editor.ui.get(this._commandNameToUIName(LITE.Commands.TOGGLE_TRACKING));
			if (ui) {
				ui.setState(tracking ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF);
				this._setButtonTitle(ui, tracking ? 'Stop tracking changes' : 'Start tracking changes');
			}
			if (bNotify !== false) {
				this._editor.fire(LITE.Events.TRACKING, {tracking:tracking});
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
				this._setButtonTitle(ui, vis ? 'Hide tracked changes' : 'Show tracked changes');
			}
			if (bNotify !== false) {
				this._editor.fire(LITE.Events.SHOW_HIDE, {show:vis});
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
		isTracking : function() {
			return this._isTracking;
		},
		
		/**
		 * Accept all tracked changes
		 */
		acceptAll : function(options) {
			this._tracker.acceptAll(options);
			this._cleanup();
			this._editor.fire(LITE.Events.ACCEPT, {options : options});
		},
		
		/**
		 * Reject all tracked changes
		 */
		rejectAll : function(options) {
			this._tracker.rejectAll(options);
			this._cleanup();
			this._editor.fire(LITE.Events.REJECT, {options : options});
		},
		
		/**
		 * Set the name & id of the current user
		 * @param info an object with the fields name, id
		 */
		setUserInfo : function(info) {
			info = info || {};
			if (this._tracker) {
				this._tracker.setCurrentUser({id: info.id || "14", name : info.name || "user"});
			}
			if (this._editor) {
				var lite = this._editor.config.lite || {};
				lite.userId = info.id;
				lite.userName = info.name;
				this._editor.config.lite = lite;
			};
		},
		
		/**
		 * Return the count of pending changes
		 * @param options optional list of user ids whose changes we include or exclude (only one of the two should be provided,
		 * exclude has precdence).
		 */
		countChanges : function(options) {
			return ((this._tracker && this._tracker.countChanges(options)) || 0);		
		},
		
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
		
		getCleanText : function() {
			var root = this._getBody();
			if (! root){
				return "";
			}
			var textFragments = new Array();
			textFragments.push("");
			var deleteClass = this._tracker.getDeleteClass();
			this._getCleanText(root, textFragments, deleteClass);
			var str = textFragments.join("\n");
			str = str.replace(/&nbsp(;)?/ig, ' ');
			return str;
		},

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
			this._onReady();
		},
		
		_onScriptsLoaded : function(completed, failed) {
			//console.log("ICE: scripts loaded");
			this._scriptsLoaded = true;
			this._onReady();
		},
		
		_loadCSS : function(doc) {
			//console.log("plugin load CSS")
			var head = doc.getElementsByTagName("head")[0];
			var style = jQuery(head).find("#__lite__css__");
			if (! style.length) {
				var style = doc.createElement("link");
				style.setAttribute("rel", "stylesheet");
				style.setAttribute("type", "text/css");
				style.setAttribute("id", "__lite__css__");
				style.setAttribute("href", this.path + "css/lite.css");
				head.appendChild(style);
			}
		},
		
		_onReady : function() {
			if (! this._scriptsLoaded || ! this._domLoaded) {
				//console.log("ICE: cannot proceed");
				return;
			}
			// leave some time for initing, seems to help...
			setTimeout(this._afterReady.bind(this), 20);
		},
		
		_getBody : function() {
			try {
				var mode = this._editor.elementMode;
				if (CKEDITOR.ELEMENT_MODE_INLINE == mode) {
					return this._editor.element.$;
				}
					
				return this._editor.document.$.body;
			}
			catch (e) {
				return null;
			}
		},
		
		_afterReady : function() {
			var e = this._editor;
			var doc = e.document.$;
			this._loadCSS(doc);
			var body = this._getBody();
			
			if (! this._eventsBounds) {
				this._eventsBounds = true;
				e.on("afterCommandExec", (function(event) {
					var name = this._tracker && event.data && event.data.name;
					if (name == "undo" || name == "redo") {
						this._tracker.reload();
					}
				}).bind(this));
				e.on("paste", this._onPaste.bind(this));
			}
			
			if (this._tracker) {
				if (body != this._tracker.getContentElement()) {
					this._tracker.stopTracking(true);
					jQuery(this._tracker).unbind();
					this._tracker = null;
				}
			}
		
			if (null == this._tracker) {
				var config = e.config.lite || {};
				var iceprops = {
						element: body,
						isTracking: true,
						handleEvents : true,
						mergeBlocks : true,
						currentUser: {
							id: config.userId || "",
							name: config.userName || ""
						},
						plugins: [
						],
						changeTypes: {
							insertType: {tag: this.props.insertTag, alias: this.props.insertClass},
							deleteType: {tag: this.props.deleteTag, alias: this.props.deleteClass}
						}
				};
				jQuery.extend(iceprops, this.props);
				this._tracker = new ice.InlineChangeEditor(iceprops);
				try {
					this._tracker.startTracking();
					this.toggleTracking(this._isTracking, false);
					jQuery(this._tracker).on("change", this._onIceChange.bind(this)).on("textChange", this._onIceTextChanged.bind(this));
					e.on("selectionChange", this._onSelectionChanged.bind(this));
					e.fire(LITE.Events.INIT, {lite: this});
					this._onIceChange(null);
				}
				catch(e) {
					this._logError("ICE plugin init:", e);
				}
			}
		},
		
		_onToggleShow : function(event) {
			this.toggleShow();
		},
		
		_onToggleTracking : function(event) {
			this.toggleTracking();
		},
		
		_onRejectAll : function(event)  {
			this.rejectAll();
		},
		
		_onAcceptAll : function(event) {
			this.acceptAll();
		},
		
		_onAcceptOne : function(event) {
			var node = this._tracker.currentChangeNode();
			if (node) {
				this._tracker.acceptChange(node);
				this._cleanup();
				this._editor.fire(LITE.Events.ACCEPT);
				this._onSelectionChanged(null);
			}
		},
		
		_onRejectOne : function(event) {
			var node = this._tracker.currentChangeNode();
			if (node) {
				this._tracker.rejectChange(node);
				this._cleanup();
				this._editor.fire(LITE.Events.REJECT);
				this._onSelectionChanged(null);
			}
		},
		
		/**
		 * Clean up empty ICE elements
		 */
		_cleanup : function() {
			var body = this._getBody();
			empty = jQuery(body).find(self.insertSelector + ':empty,' + self.deleteSelector + ':empty');
			empty.remove();
			this._onSelectionChanged(null);
		},
		
		_setButtonTitle : function(button, title) {
			var e = jQuery('#' + button._.id);
			e.attr('title', title);
		},
		
		/**
		 * Paste the content of the clipboard through ICE
		 */
		_onPaste : function(evt){
			if (! this._tracker || ! this._isTracking) {
				return true;
			}
			var data = evt && evt.data;
		
			if (data && 'html' == data.type && data.dataValue) {
				var changeid = this._tracker.startBatchChange();
				try {
					var doc = this._editor.document.$;
					var container = doc.createElement("div");
					container.innerHTML = String(data.dataValue);
					container = this._tracker.getCleanDOM(container);
					var childNode = container.firstChild;
					do {
						var nextNode = childNode.cloneNode(true);
						this._tracker.insert(nextNode);
					}
					while (childNode = childNode.nextSibling);
					evt.cancel();
					this._onIceTextChanged();
					return false;
				}
				catch (e) {
					this._logError("ice plugin paste:", e);
				}
				finally {
					this._tracker.endBatchChange(changeid);
				}
				
			}
			return true;
		},
		
		/**
		 * Set the state of multiple commands
		 * @param commands An array of command names or a comma separated string
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
		
		_onSelectionChanged : function(event) {
			// console.log("selection changed event");
			var inChange = this._isTracking && this._tracker && this._tracker.isInsideChange();
			var state = inChange && this._canAcceptReject ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED;
			this._setCommandsState([LITE.Commands.ACCEPT_ONE, LITE.Commands.REJECT_ONE], state);
		},
		
		/**
		 * called when ice fires a change event
		 * @param e jquery event
		 */
		_onIceChange : function(e) {
			var hasChanges = this._isTracking && this._tracker && this._tracker.hasChanges();
			var state = hasChanges && this._canAcceptReject ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED;
			this._setCommandsState([LITE.Commands.ACCEPT_ALL, LITE.Commands.REJECT_ALL], state);
			this._onSelectionChanged();
			this._triggerChange();
		},
		
		_onIceTextChanged : function(e) {
			this._triggerChange();
		},
		
		_triggerChange : function() {
			if (! this._changeTimeout) {
				this._changeTimeout = setTimeout(this._boundNotifyChange, 1);
			}
		},
		
		_notifyChange : function() {
			this._changeTimeout = null;
			this._editor.fire('change');
		},
		
		_commandNameToUIName : function(command) {
			return command.replace(".", "_");
		},
		
		_setPluginFeatures : function(editor, props) {
			if (! editor || ! editor.filter || ! editor.filter.addFeature) {
				return;
			}
			
			try {
				function makeClasses(tag) {
					var classes = [props.deleteClass,props.insertClass];
					for (var i = 0; i < 10;++i) {
						classes.push(props.stylePrefix + "-" + i);
					}
					return tag + '(' + classes.join(',') + ')';
				}
				
				function makeAttributes(tag) {
		//			allowedContent:'span[data-cid,data-time,data-userdata,data-userid,data-username,title]'
					var attrs = ['title'];
					for (var key in props) {
						if (props.hasOwnProperty(key)) {
							var value = props[key];
							if ((typeof value == "string") && value.indexOf("data-") == 0) {
								attrs.push(value);
							};
						};
					};
					return tag + '[' + attrs.join(',') + ']';
				}
				
				var features = [];
				
				if (props.insertTag) {
					features.push(makeClasses(props.insertTag));
					features.push(makeAttributes(props.insertTag));
				}
				if (props.deleteTag && props.deleteTag != props.insertTag) {
					features.push(makeClasses(props.deleteTag));
					features.push(makeAttributes(props.deleteTag));
				}
				
				for (var i = 0; i < features.length; ++i) {
					editor.filter.addFeature({ allowedContent: features[i] });
				}
				
		/*		ed.filter.addFeature({
					allowedContent:'span(ice-ins,ice-del,cts-1,cts-2,cts-3)'
				});
				ed.filter.addFeature({
					allowedContent:'span[data-cid,data-time,data-userdata,data-userid,data-username,title]'
				}); */
			}
			catch (e){
				this._logError(e);
			}
		},
		
		_logError : function() {
			var t = typeof console;
			if (t != "undefined" && console.error) {
				var args = Array.prototype.slice.apply(arguments);
				console.error(args.join(' '));
			}
		}
		
	};
	
	function _ieFix () {
		/* Begin fixes for IE */
			Function.prototype.bind = Function.prototype.bind || function () {
				"use strict";
				var fn = this, args = Array.prototype.slice.call(arguments),
				object = args.shift();
				return function () {
					return fn.apply(object,
				args.concat(Array.prototype.slice.call(arguments)));
				};
			};

			/* Mozilla fix for MSIE indexOf */
			Array.prototype.indexOf = Array.prototype.indexOf || function (searchElement /*, fromIndex */) {
				"use strict";
				if (this == null) {
					throw new TypeError();
				}
				var t = Object(this);
				var len = t.length >>> 0;
				if (len === 0) {
					return -1;
				}
				var n = 0;
				if (arguments.length > 1) {
					n = Number(arguments[1]);
					if (n != n) { // shortcut for verifying if it's NaN
						n = 0;
					} else if (n != 0 && n != Infinity && n != -Infinity) {
						n = (n > 0 || -1) * Math.floo1r(Math.abs(n));
					}
				}
				if (n >= len) {
					return -1;
				}
				var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
				for (; k < len; k++) {
					if (k in t && t[k] === searchElement) {
						return k;
					}
				}
				return -1;
			};

			Array.prototype.lastIndexOf = Array.prototype.indexOf || function (searchElement) {
				"use strict";
				if (this == null) {
					throw new TypeError();
				}
				var t = Object(this);
				var len = t.length >>> 0;
				while(--len >= 0) {
					if (len in t && t[len] === searchElement) {
						return len;
					}
				}
				return -1;
			};
	}
})();
