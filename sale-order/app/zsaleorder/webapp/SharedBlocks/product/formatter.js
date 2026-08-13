sap.ui.define([
  "sap/ui/core/format/DateFormat"
], function(DateFormat) {
  "use strict";
   console.log("formatter module loaded");
  return {
    formatcreateddate: function(sDate) {
       console.log("Formatter called with:", sDate);
      if (!sDate) return "";
      var oDate = (sDate instanceof Date) ? sDate : new Date(sDate);
      if (isNaN(oDate.getTime())) return sDate;
      var oDateFormat = DateFormat.getDateInstance({pattern: "dd-MM-yyyy"});
      return oDateFormat.format(oDate);
    }
  };
});
