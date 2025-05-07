/**
 * frontend/src/mock/data/helpCenterData.ts
 * Datos mock para el centro de ayuda
 * @version 1.0.0
 * @updated 2025-06-05
 */

export const mockHelpCenterCategoriesData = [
  {
    name: 'Getting Started',
    topics: [
      {
        id: 'gs-1',
        name: 'Account Setup',
        description: 'Learn how to set up your account',
        articleCounts: 5
      },
      {
        id: 'gs-2',
        name: 'Platform Navigation',
        description: 'How to use the dashboard and navigate the platform',
        articleCounts: 3
      },
      {
        id: 'gs-3',
        name: 'First Steps',
        description: 'Essential first steps for new users',
        articleCounts: 4
      }
    ]
  },
  {
    name: 'Chatbot',
    topics: [
      {
        id: 'cb-1',
        name: 'Chatbot Setup',
        description: 'Learn how to set up your WhatsApp chatbot',
        articleCounts: 6
      },
      {
        id: 'cb-2',
        name: 'Templates',
        description: 'How to use and customize chatbot templates',
        articleCounts: 4
      },
      {
        id: 'cb-3',
        name: 'AI Integration',
        description: 'Connecting your chatbot with AI services',
        articleCounts: 5
      }
    ]
  },
  {
    name: 'CRM',
    topics: [
      {
        id: 'crm-1',
        name: 'Contact Management',
        description: 'Managing contacts in the CRM',
        articleCounts: 4
      },
      {
        id: 'crm-2',
        name: 'Lead Tracking',
        description: 'How to track and manage leads effectively',
        articleCounts: 3
      },
      {
        id: 'crm-3',
        name: 'Automation',
        description: 'Setting up CRM automations',
        articleCounts: 5
      }
    ]
  }
];

export const mockArticleData = [
  {
    id: 'article-1',
    title: 'Getting Started with PymeBot',
    content: `
# Getting Started with PymeBot

Welcome to PymeBot! This guide will help you set up your account and understand the basics of our platform.

## Account Setup

1. **Sign up**: Go to the sign-up page and create your account
2. **Email verification**: Click the verification link sent to your email
3. **Complete profile**: Fill in your business details and preferences
4. **Select your vertical**: Choose the industry that best fits your business

## Dashboard Navigation

The dashboard is your command center, with the following key areas:

- **Home**: Overview of your activities and metrics
- **Chatbot**: Manage your WhatsApp chatbot
- **Customers**: View and manage your customer database
- **Appointments**: Track scheduled appointments
- **Analytics**: View performance metrics

## Next Steps

- Set up your first chatbot
- Import your customer contacts
- Customize your settings
    `,
    category: 'Getting Started',
    authors: [
      {
        name: 'Admin Team',
        img: '/img/avatars/thumb-1.jpg'
      }
    ],
    starred: false,
    updateTime: '2025-05-10T10:30:00Z',
    createdBy: 'admin',
    timeToRead: 5,
    viewCount: 245,
    commentCount: 12,
    tableOfContent: [
      {
        id: 'section-1',
        title: 'Getting Started with PymeBot',
        level: 1
      },
      {
        id: 'section-2',
        title: 'Account Setup',
        level: 2
      },
      {
        id: 'section-3',
        title: 'Dashboard Navigation',
        level: 2
      },
      {
        id: 'section-4',
        title: 'Next Steps',
        level: 2
      }
    ]
  },
  {
    id: 'article-2',
    title: 'Setting Up Your WhatsApp Chatbot',
    content: `
# Setting Up Your WhatsApp Chatbot

This guide will help you set up your WhatsApp chatbot quickly and efficiently.

## Prerequisites

Before starting, ensure you have:

1. **WhatsApp Business Account**: Required for API access
2. **PymeBot Subscription**: Active subscription with chatbot feature
3. **Phone Number**: A dedicated business phone number

## Setup Process

### 1. Connect WhatsApp Business API

Navigate to:
- Go to **Modules > Chatbot > Settings**
- Click "Connect WhatsApp"
- Follow the verification process

### 2. Create Your First Template

- Go to **Modules > Chatbot > Templates**
- Click "Create New Template"
- Choose a template type (welcome, FAQ, appointment)
- Customize your messages

### 3. Test Your Chatbot

- Use the "Test Chat" feature in your dashboard
- Send test messages to see how your chatbot responds
- Adjust responses as needed

## Best Practices

- Start with simple responses
- Use clear, concise language
- Include call-to-actions
- Test with different scenarios
    `,
    category: 'Chatbot',
    authors: [
      {
        name: 'Technical Team',
        img: '/img/avatars/thumb-2.jpg'
      }
    ],
    starred: true,
    updateTime: '2025-05-15T14:45:00Z',
    createdBy: 'tech_support',
    timeToRead: 8,
    viewCount: 328,
    commentCount: 18,
    tableOfContent: [
      {
        id: 'section-1',
        title: 'Setting Up Your WhatsApp Chatbot',
        level: 1
      },
      {
        id: 'section-2',
        title: 'Prerequisites',
        level: 2
      },
      {
        id: 'section-3',
        title: 'Setup Process',
        level: 2
      },
      {
        id: 'section-4',
        title: 'Connect WhatsApp Business API',
        level: 3
      },
      {
        id: 'section-5',
        title: 'Create Your First Template',
        level: 3
      },
      {
        id: 'section-6',
        title: 'Test Your Chatbot',
        level: 3
      },
      {
        id: 'section-7',
        title: 'Best Practices',
        level: 2
      }
    ]
  },
  {
    id: 'article-3',
    title: 'Managing Contacts in the CRM',
    content: `
# Managing Contacts in the CRM

This guide covers how to effectively manage contacts in the PymeBot CRM system.

## Adding Contacts

There are several ways to add contacts to your CRM:

1. **Manual Entry**:
   - Go to **CRM > Contacts > Add New**
   - Fill in the contact details form
   - Click "Save Contact"

2. **Bulk Import**:
   - Prepare a CSV file with your contacts
   - Go to **CRM > Contacts > Import**
   - Follow the mapping instructions
   - Upload and verify

3. **From Chatbot Interactions**:
   - Enable "Auto-create contacts" in chatbot settings
   - New WhatsApp contacts will be automatically added

## Organizing Contacts

### Using Tags

- Create tags for different contact groups
- Apply tags to contacts for easy filtering
- Use tag combinations for targeted marketing

### Contact Stages

- "New" - Recently added contacts
- "Qualified" - Contacts showing interest
- "Customer" - Active customers
- "Archived" - Inactive contacts

## Contact Management Best Practices

- Update contact information regularly
- Add notes after interactions
- Use custom fields for industry-specific information
- Set up follow-up reminders
    `,
    category: 'CRM',
    authors: [
      {
        name: 'CRM Specialist',
        img: '/img/avatars/thumb-3.jpg'
      }
    ],
    starred: false,
    updateTime: '2025-05-20T09:15:00Z',
    createdBy: 'crm_team',
    timeToRead: 6,
    viewCount: 187,
    commentCount: 9,
    tableOfContent: [
      {
        id: 'section-1',
        title: 'Managing Contacts in the CRM',
        level: 1
      },
      {
        id: 'section-2',
        title: 'Adding Contacts',
        level: 2
      },
      {
        id: 'section-3',
        title: 'Manual Entry',
        level: 3
      },
      {
        id: 'section-4',
        title: 'Bulk Import',
        level: 3
      },
      {
        id: 'section-5',
        title: 'From Chatbot Interactions',
        level: 3
      },
      {
        id: 'section-6',
        title: 'Organizing Contacts',
        level: 2
      },
      {
        id: 'section-7',
        title: 'Using Tags',
        level: 3
      },
      {
        id: 'section-8',
        title: 'Contact Stages',
        level: 3
      },
      {
        id: 'section-9',
        title: 'Contact Management Best Practices',
        level: 2
      }
    ]
  }
];

export const mockPopularArticles = [
  {
    id: 'article-2',
    title: 'Setting Up Your WhatsApp Chatbot',
    content: 'Short preview of content...',
    category: 'Chatbot',
    authors: [
      {
        name: 'Technical Team',
        img: '/img/avatars/thumb-2.jpg'
      }
    ],
    starred: true,
    updateTime: '2025-05-15T14:45:00Z',
    createdBy: 'tech_support',
    timeToRead: 8,
    viewCount: 328,
    commentCount: 18
  },
  {
    id: 'article-1',
    title: 'Getting Started with PymeBot',
    content: 'Short preview of content...',
    category: 'Getting Started',
    authors: [
      {
        name: 'Admin Team',
        img: '/img/avatars/thumb-1.jpg'
      }
    ],
    starred: false,
    updateTime: '2025-05-10T10:30:00Z',
    createdBy: 'admin',
    timeToRead: 5,
    viewCount: 245,
    commentCount: 12
  },
  {
    id: 'article-3',
    title: 'Managing Contacts in the CRM',
    content: 'Short preview of content...',
    category: 'CRM',
    authors: [
      {
        name: 'CRM Specialist',
        img: '/img/avatars/thumb-3.jpg'
      }
    ],
    starred: false,
    updateTime: '2025-05-20T09:15:00Z',
    createdBy: 'crm_team',
    timeToRead: 6,
    viewCount: 187,
    commentCount: 9
  }
];