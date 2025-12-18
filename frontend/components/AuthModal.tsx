"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/react";
import Image from "next/image";
import SignupButton from "./SignupButton";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} placement="center" backdrop="blur">
      <ModalContent className="border border-green-700 bg-linear-to-tl from-green-200 via-green-100 to-white p-6 rounded-xl">
        {(modalOnClose) => (
          <>
            <ModalHeader className="flex flex-col  gap-3  items-center">
              <Image src="/foodra_logo.jpeg" alt="Foodra Logo" width={100} height={100} className="rounded-bl-2xl rounded-tr-3xl" />
              <h2 className="text-xl font-semibold">Access Denied</h2>
            </ModalHeader>
            <ModalBody className="text-center">
              <p>You need to be signed in to access this page.</p>
              <p>Please sign up or log in to continue.</p>
            </ModalBody>
            <ModalFooter className="flex justify-center">
              <SignupButton />
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
