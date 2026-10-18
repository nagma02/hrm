import { z } from 'zod'

export const employeeSchema = z.object({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7),
  gender: z.string().trim().optional(),
  dateOfBirth: z.string().trim().optional(),
  photoUrl: z.string().trim().optional(),
  id: z.string().trim().min(3),
  dept: z.string().trim().min(2),
  title: z.string().trim().min(2),
  joinDate: z.string().min(1),
  location: z.string().trim().min(2),
  manager: z.string().trim().optional(),
  employmentType: z.string().trim().optional(),
  shift: z.string().trim().optional(),
  address: z.string().trim().optional(),
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})
export type EmployeeFormValues = z.infer<typeof employeeSchema>
