angular.module('ngJsonSql', []).service("ngJsonSql", function() {
  var jsonsql = {};

  jsonsql = {

    query: function(sql, json) {
      var returnfields = sql.match(/^(select)\s+([a-z0-9_#\.\,\*\']+)\s+from\s+([a-z0-9_\.]+)(?: where\s+\((.+)\))?\s*(?:order\sby\s+([a-z0-9_#\,\.]+))?\s*(?:limit\s+([0-9_\,]*))?/i);
      var ops = {
        fields: returnfields[2].replace(' ', '').split(','),
        from: returnfields[3].replace(' ', ''),
        where: (returnfields[4] == undefined) ? "true" : returnfields[4],
        orderby: (returnfields[5] == undefined) ? [] : returnfields[5].replace(' ', '').split(','),
        limit: (returnfields[6] == undefined) ? [] : returnfields[6].replace(' ', '').split(','),
        fieldsAs: {}
      };

      if (ops.fields[0] != "*") {
        for (var i in ops.fields) {
          fieldParts = ops.fields[i].split("#", 2) // split apart by # for AS feature
          if (fieldParts.length == 2) {
            fieldName = fieldParts[0]
            fieldsAs = ops.fields[i].substring(ops.fields[i].indexOf('#') + 1)
            ops.fieldsAs[fieldName] = fieldsAs.replace(/_/g, ' ')
            ops.fields[i] = fieldName
          }
        }
      }

      return this.parse(json, ops);
    },

    parse: function(json, ops) {
      var o = {
        fields: ["*"],
        from: "json",
        where: "",
        orderby: [],
        limit: [],
        fieldsAs: {}
      };
      for (i in ops) o[i] = ops[i];

      var result = [];
      result = this.returnFilter(json, o);
      result = this.returnOrderBy(result, o.orderby);
      result = this.returnLimit(result, o.limit);
      result = this.returnAs(result, o.fieldsAs);
      return result;
    },

    returnFilter: function(json, jsonsql_o) {
      var jsonsql_scope = (Array.isArray(json)) ? json : eval(jsonsql_o.from);
      var jsonsql_result = [];

      if (jsonsql_o.where == "")
        jsonsql_o.where = "true";

      for (var jsonsql_i in jsonsql_scope) {
        with(jsonsql_scope[jsonsql_i]) {
          try {
            if (eval(jsonsql_o.where))
              jsonsql_result.push(this.returnFields(jsonsql_scope[jsonsql_i], jsonsql_o.fields))
          } catch (err) {}
        }
      }

      return jsonsql_result;
    },

    returnFields: function(scope, fields) {
      if (fields.length == 0)
        fields = ["*"];

      if (fields[0] == "*")
        return scope;

      var returnobj = {};
      for (var i in fields) {
        if (fields[i] in scope)
          returnobj[fields[i]] = scope[fields[i]];
        else {
          try {
            var val = eval("scope." + fields[i])
            returnobj[fields[i]] = (val) ? val : "";
          } catch (err) {
            returnobj[fields[i]] = "";
          }
        }
      }
      return returnobj;
    },

    returnOrderBy: function(result, orderby) {
      if (orderby.length == 0)
        return result;
      var orderlist = new Array();
      for (var i in orderby) {
        var fieldParts = orderby[i].split("#");
        var field = fieldParts[0];
        var order = (fieldParts.length == 2) ? fieldParts[1] : "asc";
        var orderparts = order.match(/(asc|desc)([a-z0-9_]*)?/i);
        var orderdir = (orderparts) ? orderparts[1] : "asc";
        var ordertype = (orderparts && orderparts[2] in this.parsers) ? orderparts[2] : "";
        if (!ordertype && order in this.parsers)
          ordertype = order;

        var orderObj = {
          field: field,
          dir: orderdir,
          type: ordertype
        }
        orderlist.push(orderObj)
      }

      return result.sort(this.compare(this.parsers, orderlist));
    },

    returnLimit: function(result, limit) {
      switch (limit.length) {
        case 0:
          return result;
        case 1:
          return result.splice(0, limit[0]);
        case 2:
          return result.splice(limit[0] - 1, limit[1]);
      }
    },

    returnAs: function(result, fieldsAs) {
      if (Object.keys(fieldsAs).length == 0)
        return result;
      for (var i in result) {
        var obj = result[i];
        for (var old_key in fieldsAs) {
          var new_key = fieldsAs[old_key];
          if (old_key !== new_key) { // done this way to preserve the object
            Object.defineProperty(obj, new_key,
              Object.getOwnPropertyDescriptor(obj, old_key));
            delete obj[old_key];
          }
        }
      }
      return result;
    },

    compare: function(parsers, orderlist) {
      return function(a, b) {
        var resultRank = 0;
        var orderCount = 0;
        do {
          var orderObj = orderlist[orderCount];
          var field = orderObj['field'];
          var a_val = (field in a) ? a[field] : "";
          var b_val = (field in b) ? b[field] : "";

          resultRank = parsers[orderObj['type']](a_val, b_val);
          if (orderObj['dir'] == "desc" && resultRank != 0)
            resultRank = -resultRank;
          orderCount++;
        }
        while (orderCount < orderlist.length && resultRank == 0)
        return resultRank;
      }
    },

    parsers: {
      '': function(a, b) { // Default Parser
        if (a == b) return 0;
        return (a > b) ? 1 : -1;
      },
      'num': function(a, b) { // Numeric Parser
        if (a == b) return 0;
        return (a - b);
      },
      'html': function(a, b) { // HTML Parser
        var a_text = (/<[a-z][\s\S]*>/i.test(a)) ? $(a).text() : a;
        var b_text = (/<[a-z][\s\S]*>/i.test(b)) ? $(b).text() : b;
        if (a_text == b_text) return 0;
        return (a_text > b_text) ? 1 : -1;
      },

    }
  };

  return jsonsql;


});
