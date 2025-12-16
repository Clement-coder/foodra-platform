"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@nextui-org/react";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import SignupButton from "./SignupButton";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} placement="center" backdrop="blur">
      <ModalContent>
        {(modalOnClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 items-center">
              <LockClosedIcon className="h-12 w-12 text-red-500" />
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
