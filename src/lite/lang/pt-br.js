CKEDITOR.plugins.setLang('lite', 'pt-br', {
	TOGGLE_TRACKING: "Alternar marcas de revisão",
	TOGGLE_SHOW: "Alternar marcas de revisão",
	ACCEPT_ALL: "Aceitar todas as modificações",
	REJECT_ALL: "Rejeitar todas as modificações",
	ACCEPT_ONE: "Aceitar modificação",
	REJECT_ONE: "Rejeitar modificação",
	START_TRACKING: "Começar a marcar as modificações",
	STOP_TRACKING: "Parar de marcar as modificações",
	PENDING_CHANGES: "Seu documento contém algumas modificações pendentes de confirmação.\nFavor resolvê-las antes de desligar as marcas de revisão.",
	HIDE_TRACKED: "Ocultar marcas de revisão",
	SHOW_TRACKED: "Mostrar marcas de revisão",
	CHANGE_TYPE_ADDED: "acrescentado",
	CHANGE_TYPE_DELETED: "excluído",
	MONTHS: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
	NOW: "agora",
	MINUTE_AGO: "há 1 minuto atrás",
	MINUTES_AGO: "há xMinutes minutos atrás",
	BY: "por",
	ON: "em",
	AT: "há",
	LITE_LABELS_DATE: function (day, month, year) {
		if (typeof (year) != 'undefined') {
			year = ", " + year;
		}
		else {
			year = "";
		}
		return this.MONTHS[month] + " " + day + year;
	}
});