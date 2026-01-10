"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/FormInput"
import { useUser } from "@/lib/useUser"

const emailSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
})

type EmailFormData = z.infer<typeof emailSchema>

interface EmailCompletionModalProps {
  onClose: () => void
}

export function EmailCompletionModal({ onClose }: EmailCompletionModalProps) {
  const { updateUser } = useUser()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  })

  const onSubmit = (data: EmailFormData) => {
    updateUser({ email: data.email })
    onClose()
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Complete Your Profile</h2>
      <p className="text-muted-foreground mb-4">
        Please provide your email address. This can only be done once.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormInput
          label="Email"
          {...register("email")}
          error={errors.email?.message}
          placeholder="your@email.com"
          required
        />
        <Button type="submit" className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white">
          Save Email
        </Button>
      </form>
    </div>
  )
}
