import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@mumzo/ui/components/drawer";
import { AnimatePresence, motion } from "motion/react";
import { useIsMobile } from "@/core/hooks/use-mobile";
import { useLocationFlow } from "../hooks/use-location-flow";
import { AskStep } from "./steps/ask-step";
import { ListStep } from "./steps/list-step";
import { ManualStep } from "./steps/manual-step";
import { SaveAddressStep } from "./steps/save-address-step";

const STEP_TRANSITION = { duration: 0.2, ease: "easeOut" as const };

export default function LocationModal() {
  const isMobile = useIsMobile();
  const {
    isOpen,
    step,
    setStep,
    resolved,
    resolvingLocation,
    addresses,
    geolocation,
    closeModal,
    handleSkip,
    handleSelectAddress,
    handleLocationResolved,
    handleOpenChange,
    handleSaveAddress,
    selectedAddressId,
  } = useLocationFlow();

  const body = (
    <AnimatePresence mode="wait" initial={false}>
      {step === "list" && (
        <motion.div
          key="list"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={STEP_TRANSITION}
        >
          <ListStep
            addresses={addresses}
            onSelect={handleSelectAddress}
            onUseCurrentLocation={() => setStep("ask")}
            selectedAddressId={selectedAddressId}
          />
        </motion.div>
      )}
      {step === "ask" && (
        <motion.div
          key="ask"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={STEP_TRANSITION}
        >
          <AskStep
            geolocationStatus={geolocation.status}
            resolvingLocation={resolvingLocation}
            showBack={addresses.length > 0}
            onBack={() => setStep("list")}
            onUseCurrentLocation={geolocation.request}
            onEnterManually={() => setStep("manual")}
            onSkip={handleSkip}
          />
        </motion.div>
      )}
      {step === "manual" && (
        <motion.div
          key="manual"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={STEP_TRANSITION}
        >
          <ManualStep
            onBack={() => setStep("ask")}
            onResolved={handleLocationResolved}
          />
        </motion.div>
      )}
      {step === "save" && resolved && (
        <motion.div
          key="save"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={STEP_TRANSITION}
        >
          <SaveAddressStep
            resolved={resolved}
            existing={addresses}
            onBack={() => setStep("ask")}
            onSave={handleSaveAddress}
            onSkip={closeModal}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        {/* Keyed by step: the drawer measures its height once on mount and
         * doesn't shrink-then-regrow correctly for content that changes
         * height via conditional children, so each step gets a fresh popup
         * to remeasure against instead of fighting the cached height. */}
        <DrawerContent
          key={step}
          className="rounded-t-3xl border-border/60 bg-background"
        >
          <DrawerHeader className="sr-only">
            <DrawerTitle>Where should we deliver?</DrawerTitle>
            <DrawerDescription>
              Enable location or enter your address to check delivery
              availability.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-6 pt-3">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-3xl border border-border/60 bg-background p-6 sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>Where should we deliver?</DialogTitle>
          <DialogDescription>
            Enable location or enter your address to check delivery
            availability.
          </DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
