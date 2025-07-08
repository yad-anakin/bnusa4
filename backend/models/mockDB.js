/**
 * Mock Database Service for Development
 * This provides in-memory storage when MongoDB Atlas connection fails
 */

class MockDB {
  constructor() {
    this.users = [];
    this.articles = [];
    this.nextUserId = 1;
    this.nextArticleId = 1;
    
    // Add some sample data
    this.addSampleData();
    
    console.log('🔧 MockDB initialized with sample data');
  }
  
  addSampleData() {
    // Add sample users
    this.users.push({
      _id: this.nextUserId++,
      name: 'ئاکۆ محەمەد',
      username: 'ako_m',
      email: 'ako.m@example.com',
      bio: 'نووسەر و ڕۆژنامەنووس لە بواری تەکنەلۆژیا و زانست. خوێندکاری دکتۆرا لە زانکۆی سلێمانی.',
      profileImage: '/images/placeholders/avatar-am-primary.png',
      bannerImage: '/images/placeholders/profile-banner.jpg',
      joinDate: new Date('2023-12-01'),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    this.users.push({
      _id: this.nextUserId++,
      name: 'شادی عەزیز',
      username: 'shady_a',
      email: 'shady.a@example.com',
      bio: 'نووسەر و ڕۆژنامەنووس لە بواری هونەر و ئەدەبیات.',
      profileImage: '/images/placeholders/avatar-sa-primary.png',
      bannerImage: '/images/placeholders/profile-banner.jpg',
      joinDate: new Date('2024-01-15'),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Add sample articles
    this.articles.push({
      _id: this.nextArticleId++,
      title: 'کاریگەری زیرەکی دەستکرد لەسەر داهاتووی مرۆڤایەتی',
      description: 'لەم وتارەدا باس لە گرنگترین گۆڕانکارییەکانی زیرەکی دەستکرد و کاریگەرییەکانی لەسەر ژیانی مرۆڤ دەکەین...',
      content: 'لەم وتارەدا باس لە گرنگترین گۆڕانکارییەکانی زیرەکی دەستکرد و کاریگەرییەکانی لەسەر ژیانی مرۆڤ دەکەین... ئەم تەکنەلۆژیایە دەتوانێت ژیانی مرۆڤەکان بە شێوەیەکی بنەڕەتی بگۆڕێت بە باشتر یاخود بە خراپتر، ئەمە بەستراوەتەوە بە چۆنیەتی بەکارهێنانی.',
      author: 1,
      coverImage: '/images/placeholders/article-1.jpg',
      categories: ['زانست', 'تەکنەلۆژیا'],
      status: 'published',
      likes: [],
      comments: [],
      views: 45,
      readTime: 7,
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date('2024-02-15')
    });
    
    this.articles.push({
      _id: this.nextArticleId++,
      title: 'گەشتێک بە مێژووی کوردستاندا',
      description: 'گەشتێکی مێژوویی بە شارە کۆنەکانی کوردستاندا، لە ئاماژە بە گرنگترین ڕووداوە مێژووییەکان...',
      content: 'گەشتێکی مێژوویی بە شارە کۆنەکانی کوردستاندا، لە ئاماژە بە گرنگترین ڕووداوە مێژووییەکان... کوردستان خاوەنی مێژوویەکی دەوڵەمەند و کەلتوورێکی بەهێزە کە شایانی توێژینەوەیە.',
      author: 2,
      coverImage: '/images/placeholders/article-2.jpg',
      categories: ['مێژوو', 'گەشتیاری'],
      status: 'published',
      likes: [1],
      comments: [],
      views: 67,
      readTime: 10,
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-02-10')
    });
  }
  
  // User methods
  async findUserById(id) {
    return this.users.find(user => user._id === id) || null;
  }
  
  async findUserByUsername(username) {
    return this.users.find(user => user.username === username) || null;
  }
  
  async findUserByEmail(email) {
    return this.users.find(user => user.email === email) || null;
  }
  
  async createUser(userData) {
    const newUser = {
      _id: this.nextUserId++,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }
  
  async countUsers() {
    return this.users.length;
  }
  
  // Article methods
  async findArticleById(id) {
    return this.articles.find(article => article._id === id) || null;
  }
  
  async findArticlesByAuthor(authorId) {
    return this.articles.filter(article => article.author === authorId);
  }
  
  async createArticle(articleData) {
    const newArticle = {
      _id: this.nextArticleId++,
      ...articleData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.articles.push(newArticle);
    return newArticle;
  }
  
  async countArticles() {
    return this.articles.length;
  }
}

// Create a singleton instance
const mockDB = new MockDB();

module.exports = mockDB; 