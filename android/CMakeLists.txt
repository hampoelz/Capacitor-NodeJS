# For more information about using CMake with Android Studio, read the
# documentation: https://d.android.com/studio/projects/add-native-code.html

# Sets the minimum version of CMake required to build the native library.

cmake_minimum_required(VERSION 3.4.1)

# Creates and names a library, sets it as either STATIC
# or SHARED, and provides the relative paths to its source code.
# You can define multiple libraries, and CMake builds them for you.
# Gradle automatically packages shared libraries with your APK.

add_library( native-lib
             SHARED
             src/main/cpp/native-lib.cpp
             src/main/cpp/Bridge.cpp )

include_directories(libnode/include/node/)

add_library( libnode
             SHARED
             IMPORTED )

set_target_properties( libnode
                       PROPERTIES IMPORTED_LOCATION
                       ${CMAKE_SOURCE_DIR}/libnode/bin/${ANDROID_ABI}/libnode.so )

find_library( log-lib
              log )

target_link_libraries( native-lib
                       libnode
                       ${log-lib} )