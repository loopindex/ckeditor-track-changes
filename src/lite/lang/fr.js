CKEDITOR.plugins.setLang( 'lite', 'fr', {
	TOGGLE_TRACKING: "Activer/désactiver le suivi des modifications",
	TOGGLE_SHOW: "Activer/désactiver le suivi des modifications",
	ACCEPT_ALL: "Accepter toutes les modifications",
	REJECT_ALL: "Refuser toutes les modifications",
	ACCEPT_ONE: "Accepter",
	REJECT_ONE: "Refuser",
	START_TRACKING: "Activer le suivi des modifications",
	STOP_TRACKING: "Désactiver le suivi des modifications",
	PENDING_CHANGES: "Votre document contient des modifications en attente.\nVeuillez les traiter avant de désactiver le suivi des modifications.",
	HIDE_TRACKED: "Masquer les marques de modifications",
	SHOW_TRACKED: "Afficher les marques de modification",
	CHANGE_TYPE_ADDED: "inséré",
	CHANGE_TYPE_DELETED: "supprimé",
	MONTHS: ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juill.", "Août", "Sept.", "Oct.", "Nov.", "Déc."],
	NOW: "maintenant",
	MINUTE_AGO: "il y a 1 minute",
	MINUTES_AGO: "il y a xMinutes minutes",
	BY: "par",
	ON: "en",
	AT: "à",
	LITE_LABELS_DATE: function(day, month, year)
	{
		if(typeof(year) != 'undefined') {
			year = " " + year;
		}
		else {
			year = "";
		}
		return day + " " + this.MONTHS[month] + year;
	}
});