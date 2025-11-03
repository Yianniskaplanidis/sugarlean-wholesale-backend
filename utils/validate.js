const { z } = require('zod');

const ApplicationSchema = z.object({
  companyName: z.string().min(2),
  contactName: z.string().min(2),
  phone: z.string().optional().or(z.literal('')),
  abn: z.string().optional().or(z.literal('')),
  email: z.string().email(),
  street: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2),
  postCode: z.string().min(3),
  country: z.string().min(2),
  message: z.string().max(2000).optional().or(z.literal('')),
  marketingOptIn: z.boolean().optional().default(false),
  termsAccepted: z.boolean().optional().default(false),
});

module.exports = { ApplicationSchema };
