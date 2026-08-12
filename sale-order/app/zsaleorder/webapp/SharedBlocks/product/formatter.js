sap.ui.define([
  "sap/ui/core/format/DateFormat"
], function(DateFormat) {
  "use strict";
  return {
    formatcreateddate: function(sDate) {
      if (!sDate) return "";
      var oDate = (sDate instanceof Date) ? sDate : new Date(sDate);
      if (isNaN(oDate.getTime())) return sDate;
      var oDateFormat = DateFormat.getDateInstance({pattern: "dd-MM-yyyy"});
      return oDateFormat.format(oDate);
    }
  };
});
