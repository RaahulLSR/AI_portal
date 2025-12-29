
export type UserRole = 'admin' | 'customer';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  brand_name?: string;
  tagline?: string;
  description?: string;
  brand_assets?: string[]; // Array of storage paths/URLs
  phone_number?: string;
  contact_email?: string;
}

export type ProjectCategory = 'AI Services' | 'Websites & Apps' | 'Automations';
export type ProjectStatus = 'Pending' | 'In Progress' | 'Customer Review' | 'Accepted' | 'Rework Requested' | 'Paid' | 'Completed';

export interface Project {
  id: string;
  project_number: string;
  customer_id: string;
  category: ProjectCategory;
  status: ProjectStatus;
  project_name?: string;
  description: string;
  spec_style_number?: string;
  spec_colors?: string;
  spec_sizes?: string;
  spec_apparel_type?: string;
  spec_gender?: string;
  spec_age_group?: string;
  wants_new_style: boolean;
  wants_tag_creation: boolean;
  wants_color_variations: boolean;
  wants_style_variations: boolean;
  wants_marketing_poster: boolean;
  admin_response?: string;
  rework_feedback?: string;
  bill_amount: number;
  created_at: string;
  attachments: string[]; // Customer uploaded files
  admin_attachments: string[]; // Admin solution files
  profiles?: Profile; // Joined data
}

export interface Payment {
  id: string;
  customer_id: string;
  project_ids: string[];
  amount: number;
  proof_url?: string;
  status: 'Pending Verification' | 'Verified' | 'Rejected';
  created_at: string;
}
