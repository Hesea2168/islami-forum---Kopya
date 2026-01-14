// js/topics/topics.js - Ana Konu Modülü (Tüm topic modüllerini birleştirir)

const Topics = {
    // TopicCreate modülünden
    showCreateTopicForm: (category, categoryName) => TopicCreate.showCreateTopicForm(category, categoryName),
    
    // TopicView modülünden
    showTopic: (topicId, page) => TopicView.showTopic(topicId, page),
    showUserTopics: (username) => TopicView.showUserTopics(username),
    
    // Ortak özellikler
    repliesPerPage: 25,
    currentPage: 1
};