import * as z from 'zod';

export const schema = z.object({
  name: z.string().min(1, {message: 'Name is required'}),
  email: z.string().email({message: 'Invalid email address'}),
  ticketDescription: z.string().min(1, {message: 'Description is required'}),
  ticketType: z.string().min(1, {message: 'Ticket type is required'}),
  status: z.string().min(1, {message: 'Status is required'}),
  password: z
    .string()
    .min(6, {message: 'Password must be at least 6 characters long'}),
});
