const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const forgotForm = document.getElementById('forgotForm');
const dashboardBox = document.getElementById('dashboardBox');

function showSignup() {
  loginForm.classList.remove('active');
  signupForm.classList.add('active');
  forgotForm.classList.remove('active');
  dashboardBox.classList.remove('active');
}

function showLogin() {
  signupForm.classList.remove('active');
  loginForm.classList.add('active');
  forgotForm.classList.remove('active');
  dashboardBox.classList.remove('active');
}

function showForgot() {
  loginForm.classList.remove('active');
  signupForm.classList.remove('active');
  forgotForm.classList.add('active');
  dashboardBox.classList.remove('active');
}

function toggleClassField() {
  const designation = document.getElementById('designationSelect').value;
  const classField = document.getElementById('classField');
  
  if (designation === 'class_teacher') {
    classField.classList.remove('hidden');
  } else {
    classField.classList.add('hidden');
  }
}

function togglePasswordVisibility(fieldId, iconElement) {
  const field = document.getElementById(fieldId);

  if (field.type === 'password') {
    field.type = 'text';
    iconElement.classList.remove('fa-eye');
    iconElement.classList.add('fa-eye-slash');
  } else {
    field.type = 'password';
    iconElement.classList.remove('fa-eye-slash');
    iconElement.classList.add('fa-eye');
  }
}

/* =====================================================
   IMAGE RESIZE
   Profile Picture → 100 × 100 px
   Signature → 20 × 10 px
===================================================== */

function getBase64(file, targetWidth, targetHeight) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {
      const img = new Image();

      img.onload = function() {
        const canvas = document.createElement('canvas');

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context পাওয়া যায়নি।'));
          return;
        }

        const scale = Math.min(
          targetWidth / img.width,
          targetHeight / img.height
        );

        const newWidth = img.width * scale;
        const newHeight = img.height * scale;

        const x = (targetWidth - newWidth) / 2;
        const y = (targetHeight - newHeight) / 2;

        ctx.clearRect(0, 0, targetWidth, targetHeight);

        ctx.drawImage(
          img,
          x,
          y,
          newWidth,
          newHeight
        );

        resolve(
          canvas.toDataURL('image/jpeg', 0.85)
        );
      };

      img.onerror = function() {
        reject(new Error('Image load করা যায়নি।'));
      };

      img.src = event.target.result;
    };

    reader.onerror = function(error) {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
}

/* =====================================================
   REGISTERED TEACHERS LIST
   শুধুমাত্র Teacher ID রাখা হবে।
   এতে Profile Picture / Signature Base64
   বারবার duplicate হবে না।
===================================================== */

function getRegisteredTeacherIds() {
  const raw = localStorage.getItem('LS_REGISTERED_TEACHERS');

  if (!raw) return [];

  try {
    const list = JSON.parse(raw);

    if (!Array.isArray(list)) return [];

    const ids = list
      .map(item => {
        if (typeof item === 'string') {
          return item;
        }

        if (
          item &&
          typeof item === 'object' &&
          item.teacherId
        ) {
          return item.teacherId;
        }

        return null;
      })
      .filter(Boolean);

    return [...new Set(ids)];

  } catch (error) {
    console.error(
      'Registered teachers list error:',
      error
    );

    return [];
  }
}

function saveRegisteredTeacherIds(ids) {
  const uniqueIds = [
    ...new Set(
      ids.filter(Boolean)
    )
  ];

  localStorage.removeItem(
    'LS_REGISTERED_TEACHERS'
  );

  localStorage.setItem(
    'LS_REGISTERED_TEACHERS',
    JSON.stringify(uniqueIds)
  );
}

/* =====================================================
   1. SIGNUP FORM SUBMISSION
===================================================== */

document.getElementById('signupFormElement').addEventListener(
  'submit',
  async function(e) {

    e.preventDefault();
    
    const teacherId =
      document.getElementById(
        'regTeacherId'
      ).value.trim();

    const password =
      document.getElementById(
        'regPassword'
      ).value;

    const confirmPassword =
      document.getElementById(
        'regConfirmPassword'
      ).value;

    const firstName =
      document.getElementById(
        'regFirstName'
      ).value.trim();

    const lastName =
      document.getElementById(
        'regLastName'
      ).value.trim();

    const designation =
      document.getElementById(
        'designationSelect'
      ).value;

    const className =
      document.getElementById(
        'classSelect'
      ).value;

    const hint =
      document.getElementById(
        'regHint'
      ).value.trim();
    
    const profilePicFile =
      document.getElementById(
        'regProfilePic'
      ).files[0];

    const signatureFile =
      document.getElementById(
        'regSignature'
      ).files[0];

    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (localStorage.getItem(teacherId)) {
      alert(
        'Teacher ID already registered! Please login.'
      );
      return;
    }

    let profilePicBase64 = '';
    let signatureBase64 = '';

    try {

      /*
        Profile Picture:
        যেকোনো original size
        → 100 × 100 px
      */

      if (profilePicFile) {
        profilePicBase64 =
          await getBase64(
            profilePicFile,
            100,
            100
          );
      }

      /*
        Signature:
        যেকোনো original size
        → 20 × 10 px
      */

      if (signatureFile) {
        signatureBase64 =
          await getBase64(
            signatureFile,
            20,
            10
          );
      }

    } catch (err) {

      console.error(err);

      alert(
        'ছবি বা সিগনেচার পড়তে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
      );

      return;
    }

    const userData = {
      teacherId,
      password,
      firstName,
      lastName,
      designation,
      className,
      hint,
      profilePic: profilePicBase64,
      signature: signatureBase64
    };

    /*
      পুরোনো list থেকেও Teacher ID বের করা হবে।
      ফলে পুরোনো registration নষ্ট হবে না।
    */

    const registeredTeacherIds =
      getRegisteredTeacherIds();

    if (
      !registeredTeacherIds.includes(
        teacherId
      )
    ) {
      registeredTeacherIds.push(
        teacherId
      );
    }

    try {

      /*
        পুরোনো full teacher-object list সরানো হচ্ছে।
        এখন শুধু Teacher ID list থাকবে।
      */

      localStorage.removeItem(
        'LS_REGISTERED_TEACHERS'
      );

      /*
        সম্পূর্ণ Teacher information
        শুধু Teacher ID-এর অধীনে একবার থাকবে।
      */

      localStorage.setItem(
        teacherId,
        JSON.stringify(userData)
      );

      /*
        Dashboard-এর জন্য শুধু ID list।
      */

      localStorage.setItem(
        'LS_REGISTERED_TEACHERS',
        JSON.stringify(
          registeredTeacherIds
        )
      );

    } catch (err) {

      console.error(
        'Registration storage error:',
        err
      );

      /*
        অসম্পূর্ণ Teacher data রেখে দেওয়া হবে না।
      */

      localStorage.removeItem(
        teacherId
      );

      try {

        const oldIds =
          registeredTeacherIds.filter(
            id => id !== teacherId
          );

        localStorage.removeItem(
          'LS_REGISTERED_TEACHERS'
        );

        localStorage.setItem(
          'LS_REGISTERED_TEACHERS',
          JSON.stringify(oldIds)
        );

      } catch (restoreError) {

        console.error(
          'Storage restore error:',
          restoreError
        );
      }

      alert(
        'Registration সম্পূর্ণ করা যাচ্ছে না। Profile Picture এবং Signature-এর ছবি একটু ছোট করে আবার চেষ্টা করুন।'
      );

      return;
    }

    alert(
      'Registration Successful! Please login.'
    );

    showLogin();

    this.reset();
  }
);

/* =====================================================
   2. LOGIN FORM
===================================================== */

document.getElementById('loginFormElement').addEventListener(
  'submit',
  function(e) {

    e.preventDefault();
    
    const teacherId =
      document.getElementById(
        'loginTeacherId'
      ).value.trim();

    const password =
      document.getElementById(
        'loginPassword'
      ).value;

    const storedUser =
      localStorage.getItem(
        teacherId
      );

    if (!storedUser) {

      alert(
        'Teacher ID not found! Please register first.'
      );

      return;
    }

    let userObj;

    try {

      userObj =
        JSON.parse(
          storedUser
        );

    } catch (error) {

      alert(
        'Teacher data is corrupted. Please register again.'
      );

      return;
    }

    if (
      userObj.password ===
      password
    ) {

      localStorage.setItem(
        'LS_LOGGED_IN_USER',
        JSON.stringify(userObj)
      );

      window.location.href =
        'Dashboard.html';

    } else {

      alert(
        'Incorrect Password! If you forgot your password, use the "Forgot password?" option.'
      );
    }
  }
);

/* =====================================================
   3. FORGOT PASSWORD
   Teacher ID → Registration Hint → New Password
   এই নিয়ম অপরিবর্তিত রাখা হয়েছে।
===================================================== */

document.getElementById('forgotFormElement').addEventListener(
  'submit',
  function(e) {

    e.preventDefault();

    const teacherId =
      document.getElementById(
        'forgotTeacherId'
      ).value.trim();

    const hint =
      document.getElementById(
        'forgotHint'
      ).value.trim();

    const newPassword =
      document.getElementById(
        'newPassword'
      ).value;

    const storedUser =
      localStorage.getItem(
        teacherId
      );

    if (!storedUser) {

      alert(
        'Teacher ID not found!'
      );

      return;
    }

    let userObj;

    try {

      userObj =
        JSON.parse(
          storedUser
        );

    } catch (error) {

      alert(
        'Teacher data is corrupted.'
      );

      return;
    }

    /*
      Registration-এর সময় দেওয়া Hint-এর
      সঙ্গে এখানে মিলানো হবে।
    */

    if (
      userObj.hint &&
      userObj.hint.toLowerCase() ===
      hint.toLowerCase()
    ) {

      userObj.password =
        newPassword;

      /*
        Password update করার সময়
        Teacher-এর সম্পূর্ণ data আগের মতোই
        রাখা হচ্ছে।
      */

      localStorage.setItem(
        teacherId,
        JSON.stringify(userObj)
      );

      /*
        পুরোনো object-list থাকলেও
        সেটিকে ID-list-এ convert করা হবে।
      */

      try {

        const allRegisteredTeacherIds =
          getRegisteredTeacherIds();

        if (
          !allRegisteredTeacherIds.includes(
            teacherId
          )
        ) {
          allRegisteredTeacherIds.push(
            teacherId
          );
        }

        saveRegisteredTeacherIds(
          allRegisteredTeacherIds
        );

      } catch (error) {

        console.error(
          'Teacher list update error:',
          error
        );
      }

      alert(
        'Password successfully updated! You can now login.'
      );

      showLogin();

      this.reset();

    } else {

      alert(
        'Incorrect Password Hint / Clue!'
      );
    }
  }
);

/* =====================================================
   LOGOUT
===================================================== */

function logout() {

  localStorage.removeItem(
    'LS_LOGGED_IN_USER'
  );

  window.location.href =
    'Index.html';
}