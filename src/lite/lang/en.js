var LITE_LABELS = {
	TOGGLE_TRACKING : "Toggle Tracking Changes",
	TOGGLE_SHOW : "Toggle Tracking Changes",
	ACCEPT_ALL : "Accept all changes",
	REJECT_ALL : "Reject all changes",
	ACCEPT_ONE : "Accept Change",
	REJECT_ONE : "Reject Change",
	START_TRACKING: "Start tracking changes",
	STOP_TRACKING: "Stop tracking changes",
	PENDING_CHANGES : "Your document contains some pending changes.\nPlease resolve them before turning off change tracking.",
	HIDE_TRACKED : "Hide tracked changes",
	SHOW_TRACKED : "Show tracked changes",
	CHANGE_TYPE_ADDED : "added",
	CHANGE_TYPE_DELETED : "deleted",
	MONTHS : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
	NOW : "now",
	MINUTE_AGO : "1 minute ago",
	MINUTES_AGO : "xMinutes minutes ago",
	BY : "by",
	ON : "on",
	AT : "on",
};

function LITE_LABELS_DATE(day, month, year)
{
	if(typeof(year) != 'undefined') year = ", " + year;
	else year = "";
	return LITE_LABELS.MONTHS[month] + " " + day + year;
}