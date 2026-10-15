import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import BrandHeader from "../../components/BrandHeader";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Checkbox from "../../components/Checkbox";
import Modal from "../../components/Modal";
import { useAuth } from "../../contexts/AuthContext";
import "./LoginPage.css";

const INITIAL_FORM = { email: "", password: "" };

// 로그인은 형식 검사 없이 빈칸만 확인 (틀린 정보는 서버가 같은 문구로 안내)
function validate(form) {
  return {
    email: form.email.trim() ? "" : "이메일을 입력해 주세요",
    password: form.password ? "" : "비밀번호를 입력해 주세요",
  };
}

function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showFindPassword, setShowFindPassword] = useState(false);
  const submittingRef = useRef(false);
  const inputRefs = useRef({});

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setSubmitError("");
  };

  // 성공하면 AuthContext의 user가 채워지고, GuestRoute가 원래 가려던 페이지(없으면 메인)로 이동시킴
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return; // 중복 클릭/엔터 방지

    const errors = validate(form);
    const firstInvalid = Object.keys(errors).find((field) => errors[field]);
    if (firstInvalid) {
      setFieldErrors(errors);
      inputRefs.current[firstInvalid]?.focus();
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setSubmitError("");

    try {
      await login({ email: form.email.trim(), password: form.password, rememberMe });
    } catch (err) {
      setSubmitError(err.message);
      setForm((prev) => ({ ...prev, password: "" }));
      inputRefs.current.password?.focus();
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <div className="card">
        <BrandHeader welcome="다시 만나서 반가워요" />

        <h1 className="page-title">로그인</h1>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <Input
            ref={(el) => (inputRefs.current.email = el)}
            label="이메일"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="momori@email.com"
            value={form.email}
            onChange={handleChange("email")}
            error={fieldErrors.email}
          />
          <Input
            ref={(el) => (inputRefs.current.password = el)}
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호를 입력해 주세요"
            value={form.password}
            onChange={handleChange("password")}
            error={fieldErrors.password}
          />

          <div className="login-options">
            <Checkbox checked={rememberMe} onChange={setRememberMe}>
              로그인 상태 유지
            </Checkbox>
            <button type="button" className="text-link" onClick={() => setShowFindPassword(true)}>
              비밀번호 찾기
            </button>
          </div>

          {submitError && (
            <p className="form-error" role="alert">
              {submitError}
            </p>
          )}

          <Button type="submit" loading={loading}>
            {loading ? "로그인하는 중이에요" : "로그인"}
          </Button>
        </form>

        <p className="footer-link">
          아직 회원이 아니신가요?
          <Link to="/signup">회원가입</Link>
        </p>
      </div>

      <Modal open={showFindPassword} title="비밀번호 찾기" onClose={() => setShowFindPassword(false)}>
        준비 중이에요. 조금만 기다려 주세요!
      </Modal>
    </main>
  );
}

export default LoginPage;
