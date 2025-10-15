(function(hello) { 

 

hello.init({ 

 

linkedin: { 

 

oauth: { 

version: 2, 

response_type: 'code', 

// Updated OAuth v2 endpoints (old /uas/ endpoints are deprecated) 

auth: 'https://www.linkedin.com/oauth/v2/authorization', 

grant: 'https://www.linkedin.com/oauth/v2/accessToken' 

}, 

 

// Refresh the access_token once expired 

refresh: true, 

 

scope: { 

// LinkedIn API v2 scopes 

// See: https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication 

basic: 'r_liteprofile', 

email: 'r_emailaddress', 

files: '', 

friends: '', 

photos: '', 

publish: 'w_member_social', 

publish_files: 'w_member_social', 

share: '', 

videos: '', 

offline_access: '' 

}, 

scope_delim: ' ', 

 

// LinkedIn API v2 base URL 

base: 'https://api.linkedin.com/v2/', 

 

get: { 

// Get user profile using v2 API 

// See: https://docs.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api 

me: 'me', 

 

// Email address requires separate endpoint in v2 

'me/email': 'emailAddress?q=members&projection=(elements*(handle~))', 

 

// Note: LinkedIn v2 API has very limited access to network updates 

// The old 'me/share' endpoint (network updates) is not available in v2 

// Only your own posts can be retrieved via UGC Post API 

'me/share': function() { 

// This endpoint is deprecated and not available in API v2 

return false; 

} 

}, 

 

post: { 

// Share content using UGC Post API 

// See: https://docs.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api 

'me/share': function(p, callback) { 

var data = { 

author: 'urn:li:person:' + p.data.authorId, // Requires person ID 

lifecycleState: 'PUBLISHED', 

specificContent: { 

'com.linkedin.ugc.ShareContent': { 

shareCommentary: { 

text: p.data.message || '' 

}, 

shareMediaCategory: 'NONE' 

} 

}, 

visibility: { 

'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' 

} 

}; 

 

// Add link if provided 

if (p.data.link) { 

data.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE'; 

data.specificContent['com.linkedin.ugc.ShareContent'].media = [{ 

status: 'READY', 

originalUrl: p.data.link, 

title: { 

text: p.data.name || '' 

} 

}]; 

} 

 

p.data = JSON.stringify(data); 

p.headers['Content-Type'] = 'application/json'; 

p.headers['X-Restli-Protocol-Version'] = '2.0.0'; 

 

callback('ugcPosts'); 

} 

}, 

 

// LinkedIn v2 API doesn't support liking via simple API 

// Removed del object as it's not supported 

 

wrap: { 

me: function(o) { 

formatError(o); 

 

if (o && !o.error) { 

// LinkedIn API v2 response format 

// Map v2 fields to hello.js standard format 

if (o.localizedFirstName && o.localizedLastName) { 

o.first_name = o.localizedFirstName; 

o.last_name = o.localizedLastName; 

o.name = o.first_name + ' ' + o.last_name; 

} 

 

// Profile picture in v2 is more complex 

if (o.profilePicture && o.profilePicture['displayImage~']) { 

var images = o.profilePicture['displayImage~'].elements; 

if (images && images.length > 0) { 

// Get the largest image 

var largestImage = images[images.length - 1]; 

if (largestImage.identifiers && largestImage.identifiers.length > 0) { 

o.thumbnail = largestImage.identifiers[0].identifier; 

} 

} 

} 

} 

 

return o; 

}, 

 

'me/email': function(o) { 

formatError(o); 

 

if (o && !o.error && o.elements && o.elements.length > 0) { 

var emailData = o.elements[0]['handle~']; 

if (emailData) { 

return { 

email: emailData.emailAddress 

}; 

} 

} 

 

return o; 

}, 

 

'me/share': function(o) { 

formatError(o); 

// v2 API doesn't provide network updates easily 

// Return empty data structure 

return { 

data: [], 

paging: null 

}; 

}, 

 

'default': function(o, headers) { 

formatError(o); 

empty(o, headers); 

} 

}, 

 

xhr: function(p, qs) { 

// LinkedIn v2 API requires different parameter name 

formatQuery(qs); 

 

if (p.method !== 'get') { 

p.headers['Content-Type'] = 'application/json'; 

p.headers['X-Restli-Protocol-Version'] = '2.0.0'; 

p.proxy = true; 

return true; 

} 

 

return false; 

} 

} 

}); 

 

function formatError(o) { 

// LinkedIn v2 API error format 

if (o && o.status && o.status >= 400) { 

o.error = { 

code: o.status, 

message: o.message || 'Request failed' 

}; 

} 

// Handle serviceErrorCode format 

else if (o && o.serviceErrorCode) { 

o.error = { 

code: o.serviceErrorCode, 

message: o.message || 'Service error' 

}; 

} 

} 

 

function empty(o, headers) { 

if (JSON.stringify(o) === '{}' && headers && headers.statusCode === 200) { 

o.success = true; 

} else if (JSON.stringify(o) === '{}' && headers && headers.statusCode === 201) { 

o.success = true; 

} 

} 

 

function formatQuery(qs) { 

// LinkedIn v2 still uses oauth2_access_token for some requests 

if (qs.access_token) { 

qs.oauth2_access_token = qs.access_token; 

delete qs.access_token; 

} 

} 

 

})(hello); 