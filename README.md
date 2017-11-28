NgJsonSQL
=========
Query json objects with SQL syntax inside Angular App

Version 0.1

No other dependency is required.


1) Allows an Array of Objects to be selected, in addition to JSON data
2) Can re-name labels, just like an AS statement does, using # Hashtag notation
Example: "Select menu_order#Menu_Order" - is basically the same as saying "menu_order AS 'Menu Order' "
3) Re-built Order By to make multi-sort possible, and allows non-uniform Objects to not cause "Undefined" data
4) Changed the ORDER BY separator to #, and allow deep linking in (SELECT,WHERE,ORDER BY)
The following is a valid SQL if "user" is an object:
Example:  "select label,user.name,menu_order from data where (user.name=='Bob') order by user.name#desc,menu_order"
5) Made it possible to use # as a label.  To mimic "SELECT menu_order AS '#' " use: "select menu_order##"
