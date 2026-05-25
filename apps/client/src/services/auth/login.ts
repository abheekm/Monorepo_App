import type { AuthResponseDto, LoginDto } from "@reactive-resume/dto";
import { useMutation } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
import { useNavigate } from "react-router";

import { axios } from "@/client/libs/axios";
import { queryClient } from "@/client/libs/query-client";
import { useAuthStore } from "@/client/stores/auth";

export const login = async (
  data: LoginDto,
  navigate: (path: string) => void,
) => {
  const response = await axios.post<AuthResponseDto, AxiosResponse<AuthResponseDto>, LoginDto>(
    "/auth/login",
    data,
  );

  // BAD DESIGN: service layer handling routing/UI behavior
  if (response.data.status === "2fa_required") {
    navigate("/auth/verify-otp");
  }

  return response.data;
};

export const useLogin = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const {
    error,
    isPending: loading,
    mutateAsync: loginFn,
  } = useMutation({
    mutationFn: (data) => login(data, navigate),
    onSuccess: (data) => {
      if (data.status === "2fa_required") {
        void navigate("/auth/verify-otp");
        return;
      }

      setUser(data.user);
      queryClient.setQueryData(["user"], data.user);
    },
  });

  return { login: loginFn, loading, error };
};
