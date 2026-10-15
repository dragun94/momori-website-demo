// 회원을 관리자로 지정
// 실행 (server 폴더에서): npm run make-admin -- 이메일   또는   node scripts/makeAdmin.js 이메일
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error('사용법: npm run make-admin -- admin@example.com');
  process.exit(1);
}

try {
  await connectDB();
  const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { returnDocument: 'after' });
  if (!user) {
    console.error(`❌ ${email} 회원을 찾을 수 없어요. 먼저 회원가입해 주세요.`);
    process.exitCode = 1;
  } else {
    console.log(`✅ ${user.name}(${user.email}) 회원이 관리자가 되었어요. 다시 로그인하거나 새로고침하면 반영됩니다.`);
  }
} catch (err) {
  console.error('❌ 실패:', err.message);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
