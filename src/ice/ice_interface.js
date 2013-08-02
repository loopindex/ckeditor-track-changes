/**
Copyright 2013 LoopIndex, This file is part of the Track Changes plugin for CKEditor.

The track changes plugin is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License, version 2, as published by the Free Software Foundation.
This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with this program as the file gpl-2.0.txt. If not, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt

**/
var CKICE = {
	Events : {
		INIT : "ice:init",
		ACCEPT_SOME : "ice:acceptSome",
		ACCEPT_ALL : "ice:acceptAll",
		REJECT_SOME : "ice:rejectSome",
		REJECT_ALL : "ice:rejectAll",
		SHOW_HIDE : "ice:showHide",
		TRACKING : "ice:tracking"
	},
	
	Commands : {
		TOGGLE_TRACKING : "ice.ToggleTracking",
		TOGGLE_SHOW : "ice.ToggleShow",
		ACCEPT_ALL : "ice.AcceptAll",
		REJECT_ALL : "ice.RejectAll",
		ACCEPT_ONE : "ice.AcceptOne",
		REJECT_ONE : "ice.RejectOne"
	}
}