import { Button } from "@/components/ui/button";
import { FaGithub } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SocialsButtonsProps = {
  isLoading: boolean;
  setError: (error: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
};

export const SocialsButtons = ({
  isLoading,
  setError,
  setIsLoading,
}: SocialsButtonsProps) => {
  const router = useRouter();

  const handleSignInWithGithub = async () => {
    setError(null);
    setIsLoading(true);

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push("/api/auth/callback");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full justify-center">
      <Button
        variant="outline"
        className="hover:cursor-pointer"
        type="button"
        disabled={isLoading}
        onClick={handleSignInWithGithub}
      >
        <FaGithub className="h-4 w-4" />
        Github
      </Button>
    </div>
  );
};
