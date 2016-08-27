<% if (props.es2015 || props.jsx) {
	if (props.es2015) { 
%>module.exports = require('./lib').default;<%
	} else {
%>module.exports = require('./lib');<%
	}
} else {
%>module.exports = {};<%
} %>
