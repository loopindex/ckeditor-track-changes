
/**
Copyright 2013 LoopIndex, This file is part of the Track Changes plugin for CKEditor.

The track changes plugin is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License, version 2, as published by the Free Software Foundation.
This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with this program as the file gpl-2.0.txt. If not, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt
**/
CKEDITOR.plugins.add( 'ice',
{
	props : {
		deleteTag: 'span',
		insertTag: 'span',
		deleteClass: 'ice-del',
		insertClass: 'ice-ins',
		changeIdAttribute: 'data-cid',
		userIdAttribute: 'data-userid',
		userNameAttribute: 'data-username',
		timeAttribute: 'data-time',
		preserveOnPaste: 'p',
		user: { name: 'Unknown', id: 141414 },
		css: 'css/ice.css',
		titleTemplate : "Changed by %u %t"
	},
	
	_domLoaded : false,
	_scriptsLoaded : false,
	_editor : null,
	_tracker : null,
	_isVisible : true, // changes are visible
	_iceCommandNames : [],
	_isTracking : false,
	
	/**
	 * Called by CKEditor to init the plugin
	 * @param ed an instance of CKEditor
	 */
	init: function(ed) {
		var commandsMap = 	[	
			{ command : LITE.Commands.TOGGLE_TRACKING,
		  	 	exec : this._onToggleTracking, 
		  	 	title: "Toggle Tracking Changes",
		  	 	icon: "track_changes_on_off.png",
		  	 	trackingOnly : false,
		  	},
	  	 	{
	  	 		command: LITE.Commands.TOGGLE_SHOW, 
	  	 		exec: this._onToggleShow, 
	  	 		title: "Toggle Tracking Changes",
	  	 		icon: "show_hide.png"
	  	 	},
	  	 	{
	  			command:LITE.Commands.ACCEPT_ALL, 
	  			exec:this.acceptAll, 
	  			title:"Accept all changes",
	  			icon:"accept_all.png"
	  	 	},
	  	 	{
	  	 		command:LITE.Commands.REJECT_ALL,
	  	 		exec: this.rejectAll,
	  	 		title: "Reject all changes", 
	  	 		icon:"reject_all.png"
	  	 	},
	  	 	{
	  	 		command:LITE.Commands.ACCEPT_ONE,
	  	 		exec:this._onAcceptOne,
	  	 		title:"Accept Change",
	  	 		icon:"accept_one.png"
	  	 	},
	  	 	{
	  	 		command:LITE.Commands.REJECT_ONE,
	  	 		exec:this._onRejectOne,
	  	 		title:"Reject Change",
	  	 		icon:"reject_one.png"
	  	 	}
		];

		this._editor = ed;
		this._isVisible = true;
		this._isTracking = true;
		this._handlePaste = this._onPaste.bind(this);
		this._eventsBounds = false;
	
		ed.on("contentDom", (function(dom) {
			this._onDomLoaded(dom);
		}).bind(this));
		var path = this.path;

		var iceConfig = ed.config.ice || {};
		var jQueryPath = iceConfig.jQueryPath || "js/jquery.min.js";
		
		var commands = iceConfig.commands || [];
		var self = this;
		
		function add1(command, handler, label, icon, trackingOnly) {
			var cmd = ed.addCommand(command, {
				exec : handler.bind(self),
				modes : {wysiwyg:1,source:1}
			});

			if (commands.indexOf(command) >= 0) { // configuration doens't include this command
				var name = self._commandNameToUIName(command);
				ed.ui.addButton(name, {
					label : label,
					command : command,
					icon : path + "icons/" + icon,
					toolbar: "ice"
				}); 
				if (trackingOnly !== false) {
					self._iceCommandNames.push(command);
				}
				
			}
		}
		
		
		this._config = $.extend({}, iceConfig);
		$.each(commandsMap, function(i, rec) {
			add1(rec.command, rec.exec, rec.title, rec.icon, rec.trackingOnly);
		});
		
		
		var scripts = iceConfig.includes || [];
		
		for (var i = 0, len = scripts.length; i < len; ++i) {
			scripts[i] = path + scripts[i]; 
		}
		if (typeof(jQuery) == "undefined") {
			scripts.splice(0, 0, this.path + jQueryPath)
		}
		
		var load1 = function(_scripts) {
			if (_scripts.length < 1) {
				self._onScriptsLoaded();
			}
			else {
				CKEDITOR.scriptLoader.load(_scripts.shift(), function() {load1(_scripts);}, self)
			}
		}
		
		load1(scripts);		
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

		for (var i = this._iceCommandNames.length - 1; i >= 0; --i) {
			var cmd = this._editor.getCommand(this._iceCommandNames[i]);
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
			this._editor.fire(LITE.Events.TRACKING, {tracking:tracking})
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
	 * Accept all tracked changes
	 */
	acceptAll : function() {
		this._tracker.acceptAll();
		this._cleanup();
		this._editor.fire(LITE.Events.ACCEPT_ALL, {});
	},

	/**
	 * Reject all tracked changes
	 */
	rejectAll : function() {
		this._tracker.rejectAll();
		this._cleanup();
		this._editor.fire(LITE.Events.ACCEPT_ALL, {});
	},
	
	/**
	 * Set the name & id of the current user
	 * @param info an object with the fields name, id
	 */
	setUserInfo : function(info) {
		info = info || {};
		if (this._tracker) {
			this._tracker.setCurrentUser({id: info.id || "", name : info.name || ""});
		}
		var ice = CKEDITOR.config.ice || {};
		ice.userId = info.id;
		ice.userName = info.name;
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
		var style = doc.createElement("link");
		style.setAttribute("rel", "stylesheet");
		style.setAttribute("type", "text/css");
		style.setAttribute("href", this.path + "css/ice.css");
		head.appendChild(style);
	},
	
	_onReady : function() {
		if (! this._scriptsLoaded || ! this._domLoaded) {
			//console.log("ICE: cannot proceed");
			return;
		}
		// leave some time for initing, seems to help...
		setTimeout(this._afterReady.bind(this), 50);
	},
	
	_getBody : function() {
		try {
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
		var body = doc.body;
		var props = this.props;
		
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
			var config = e.config.ice || {};
			this._tracker = new ice.InlineChangeEditor({
				element: body,
				isTracking: true,
				handleEvents : true,
//				contentEditable: !! body.getAttribute("contentEditable"),
				changeIdAttribute: props.changeIdAttribute,
				userIdAttribute: props.userIdAttribute,
				userNameAttribute: props.userNameAttribute,
				timeAttribute: props.timeAttribute,
				currentUser: {
					id: config.userId || "",
					name: config.userName || ""
				},
				plugins: [
				],
				changeTypes: {
					insertType: {tag: this.props.insertTag, alias: this.props.insertClass},
					deleteType: {tag: this.props.deleteTag, alias: this.props.deleteClass}
				},
				titleTemplate : props.titleTemplate
			});
			try {
				this._tracker.startTracking();
				this.toggleTracking(true, false);
				jQuery(this._tracker).on("change", this._onIceChange.bind(this));
				e.on("selectionChange", this._onSelectionChanged.bind(this));
				e.fire(LITE.Events.INIT, {ice : this});
				this._onIceChange(null);
			}
			catch(e) {
				console && console.error && console.error("ICE plugin init:", e);
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
			this._editor.fire(LITE.Events.ACCEPT_SOME);
			this._onSelectionChanged(null);
		}
	},
	
	_onRejectOne : function(event) {
		var node = this._tracker.currentChangeNode();
		if (node) {
			this._tracker.rejectChange(node);
			this._cleanup();
			this._editor.fire(LITE.Events.REJECT_SOME);
			this._onSelectionChanged(null);
		}
	},
	
	/**
	 * Clean up empty ICE elements
	 */
	_cleanup : function() {
		var body = this._getBody();
		empty = $(body).find(self.insertSelector + ':empty,' + self.deleteSelector + ':empty');
		empty.remove();
		this._onSelectionChanged(null);
	},

	_setButtonTitle : function(button, title) {
 		var e = $('#' + button._.id);
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
			try {
				var doc = this._editor.document.$;
				var container = doc.createElement("div");
				container.innerHTML = String(data.dataValue);
				var childNode = container.firstChild;
				var newNode = childNode.cloneNode(true);
				this._tracker.insert(newNode);
				while (childNode = childNode.nextSibling) {
					var nextNode = childNode.cloneNode(true);
					newNode.parentNode.insertBefore(nextNode, newNode.nextSibling);
					newNode = nextNode;
				}
				evt.cancel();
				return false;
			}
			catch (e) {
				console && console.error && console.error("ice plugin paste:", e);
			};
			
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
		if (! this._isTracking) {
			return;
		}
		var inChange = this._tracker.isInsideChange();
		var state = inChange ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED;
		this._setCommandsState([LITE.Commands.ACCEPT_ONE, LITE.Commands.REJECT_ONE], state);
	},
	
	/**
	 * called when ice fires a change event
	 * @param e jquery event
	 */
	_onIceChange : function(e) {
		if (this._tracker) {
			var hasChanges = this._tracker.hasChanges();
			var state = hasChanges ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED;
			this._setCommandsState([LITE.Commands.ACCEPT_ALL, LITE.Commands.REJECT_ALL], state);
			this._onSelectionChanged();
		}
	},
	
	_commandNameToUIName : function(command) {
		return command.replace(".", "_");
	}
	

});
